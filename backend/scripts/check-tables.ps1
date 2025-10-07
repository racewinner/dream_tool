# Database connection parameters
$dbUser = "postgres"
$dbPassword = "password123"
$dbName = "dream_tool"
$dbHost = "localhost"
$dbPort = "5432"

# Connection string
$connString = "Server=$dbHost;Port=$dbPort;Database=$dbName;User Id=$dbUser;Password=$dbPassword;"

# SQL query to list all tables
$queryAllTables = @"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
"@

# SQL query to check raw_imports table structure
$queryTableStructure = @"
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'raw_imports';
"@

try {
    # Load the Npgsql assembly
    Add-Type -Path "Npgsql.dll" -ErrorAction Stop
    
    # Create and open connection
    $conn = New-Object Npgsql.NpgsqlConnection($connString)
    $conn.Open()
    
    Write-Host "✅ Successfully connected to database" -ForegroundColor Green
    
    # Get all tables
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $queryAllTables
    $reader = $cmd.ExecuteReader()
    
    $tables = @()
    while ($reader.Read()) {
        $tables += $reader.GetString(0)
    }
    $reader.Close()
    
    Write-Host "`n📋 All tables in database:" -ForegroundColor Cyan
    $tables | ForEach-Object { Write-Host "- $_" }
    
    # Check if raw_imports table exists
    $hasRawImports = $tables -contains "raw_imports"
    Write-Host "`n🔎 raw_imports table exists: " -NoNewline
    if ($hasRawImports) {
        Write-Host "✅ Yes" -ForegroundColor Green
        
        # Get table structure
        $cmd.CommandText = $queryTableStructure
        $reader = $cmd.ExecuteReader()
        
        $columns = @()
        while ($reader.Read()) {
            $columns += [PSCustomObject]@{
                ColumnName = $reader.GetString(0)
                DataType = $reader.GetString(1)
                IsNullable = $reader.GetString(2)
            }
        }
        $reader.Close()
        
        Write-Host "`n📊 raw_imports table structure:" -ForegroundColor Cyan
        $columns | Format-Table -AutoSize
    } else {
        Write-Host "❌ No" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "Stack Trace: $($_.ScriptStackTrace)" -ForegroundColor DarkGray
} finally {
    if ($conn -ne $null) {
        $conn.Close()
        Write-Host "`n🔌 Database connection closed" -ForegroundColor Cyan
    }
}

Write-Host "`n✅ Script completed" -ForegroundColor Green
