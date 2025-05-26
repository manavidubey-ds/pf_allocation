import mysql from 'mysql2';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Manavi@2809',
  database: 'pf_allocation',
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to DB:', err.stack);
    return;
  }
  console.log('✅ Connected to MySQL DB');
});

export default connection;
