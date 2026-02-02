-- Create databases if they don't exist
SELECT 'CREATE DATABASE muses'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'muses')\gexec

SELECT 'CREATE DATABASE muses_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'muses_test')\gexec
