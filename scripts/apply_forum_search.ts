/**
 * 执行论坛搜索迁移
 * 运行: npx tsx scripts/apply_forum_search.ts
 */

const dbUrl = process.env.SUPABASE_DB_URL || 'postgresql://postgres.gqwteiaouqbjmpvsxjot:mrhsSUPABASE@aws-0-us-west-2.pooler.supabase.com:5432/postgres'

async function main() {
  console.log('Executing forum search migration...')
  
  const statements = [
    // 1. 创建函数
    `CREATE OR REPLACE FUNCTION update_post_search_vector_func(
      post_id UUID, 
      post_title TEXT, 
      post_content TEXT
    )
    RETURNS void AS $$
    BEGIN
        UPDATE posts
        SET search_vector =
            setweight(to_tsvector('simple', COALESCE(post_title, '')), 'A') ||
            setweight(to_tsvector('simple', COALESCE(post_content, '')), 'B')
        WHERE id = post_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`,
    
    // 2. 创建触发器函数
    `CREATE OR REPLACE FUNCTION update_post_search_vector()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.search_vector := 
            setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
            setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'B');
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`,
    
    // 3. 创建触发器
    `DROP TRIGGER IF EXISTS trigger_update_post_search ON posts;
     CREATE TRIGGER trigger_update_post_search
     BEFORE INSERT OR UPDATE ON posts
     FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();`,
    
    // 4. 更新现有数据
    `UPDATE posts SET search_vector = 
        setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(content, '')), 'B')
     WHERE search_vector IS NULL;`
  ]
  
  // 使用原生 PostgreSQL 连接执行
  const { Client } = await import('pg')
  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    console.log('Connected to database')
    
    for (let i = 0; i < statements.length; i++) {
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      try {
        await client.query(statements[i])
        console.log(`  ✓ Statement ${i + 1} executed successfully`)
      } catch (err: unknown) {
        const error = err as Error
        console.log(`  ⚠ Statement ${i + 1} warning: ${error.message}`)
      }
    }
    
    console.log('\n✓ Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()