<?php
/**
 * Database Configuration and Connection Manager
 * 
 * @package VotingSystem\Database
 */

declare(strict_types=1);

namespace VotingSystem\Database;

use PDO;
use PDOException;
use Dotenv\Dotenv;

class DatabaseConfig
{
    /**
     * @var PDO|null Singleton PDO instance
     */
    private static ?PDO $connection = null;

    /**
     * Load environment variables from .env file
     * 
     * @throws \RuntimeException If .env file is missing
     */
    private static function loadEnvironment(): void
    {
        $envPath = __DIR__ . '/../../';
        
        if (!file_exists($envPath . '.env')) {
            throw new \RuntimeException('.env file not found. Please create one from .env.example');
        }
        
        $dotenv = Dotenv::createImmutable($envPath);
        $dotenv->load();
        
        // Validate required environment variables
        $dotenv->required([
            'DB_HOST',
            'DB_NAME',
            'DB_USER',
            'DB_PORT'
        ])->notEmpty();
        
        // DB_PASS can be empty for local development with no password
        $dotenv->ifPresent('DB_PASS')->notEmpty();
    }

    /**
     * Get PDO database connection instance
     * 
     * @return PDO Database connection
     * @throws PDOException If connection fails
     */
    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            self::loadEnvironment();
            
            $host = $_ENV['DB_HOST'] ?? 'localhost';
            $port = $_ENV['DB_PORT'] ?? '3306';
            $dbname = $_ENV['DB_NAME'] ?? 'voting_system';
            $username = $_ENV['DB_USER'] ?? 'root';
            $password = $_ENV['DB_PASS'] ?? '';
            
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                $host,
                $port,
                $dbname
            );
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_STRINGIFY_FETCHES  => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            try {
                self::$connection = new PDO($dsn, $username, $password, $options);
            } catch (PDOException $e) {
                error_log('Database connection failed: ' . $e->getMessage());
                throw new PDOException(
                    'Could not connect to the database. Please check your configuration.',
                    0,
                    $e
                );
            }
        }
        
        return self::$connection;
    }

    /**
     * Execute a query with parameters
     * 
     * @param string $sql SQL query with placeholders
     * @param array $params Parameters for the query
     * @return \PDOStatement Executed statement
     */
    public static function executeQuery(string $sql, array $params = []): \PDOStatement
    {
        $pdo = self::getConnection();
        $stmt = $pdo->prepare($sql);
        
        foreach ($params as $key => $value) {
            $type = self::getPdoType($value);
            $stmt->bindValue(
                is_int($key) ? $key + 1 : $key,
                $value,
                $type
            );
        }
        
        $stmt->execute();
        return $stmt;
    }

    /**
     * Determine PDO parameter type based on value
     * 
     * @param mixed $value The value to determine type for
     * @return int PDO::PARAM_* constant
     */
    private static function getPdoType($value): int
    {
        if (is_int($value)) {
            return PDO::PARAM_INT;
        } elseif (is_bool($value)) {
            return PDO::PARAM_BOOL;
        } elseif (is_null($value)) {
            return PDO::PARAM_NULL;
        } else {
            return PDO::PARAM_STR;
        }
    }

    /**
     * Begin a transaction
     * 
     * @return bool True on success
     */
    public static function beginTransaction(): bool
    {
        return self::getConnection()->beginTransaction();
    }

    /**
     * Commit a transaction
     * 
     * @return bool True on success
     */
    public static function commit(): bool
    {
        return self::getConnection()->commit();
    }

    /**
     * Rollback a transaction
     * 
     * @return bool True on success
     */
    public static function rollback(): bool
    {
        return self::getConnection()->rollBack();
    }

    /**
     * Get the last inserted ID
     * 
     * @return string Last inserted ID
     */
    public static function lastInsertId(): string
    {
        return self::getConnection()->lastInsertId();
    }

    /**
     * Close the database connection
     */
    public static function closeConnection(): void
    {
        self::$connection = null;
    }

    /**
     * Check if database connection is alive
     * 
     * @return bool True if connection is active
     */
    public static function isConnected(): bool
    {
        try {
            if (self::$connection instanceof PDO) {
                self::$connection->query('SELECT 1');
                return true;
            }
        } catch (PDOException $e) {
            // Connection is dead
        }
        
        return false;
    }
}

/**
 * Helper function for quick database access
 * 
 * @return PDO Database connection
 */
function db(): PDO
{
    return DatabaseConfig::getConnection();
}