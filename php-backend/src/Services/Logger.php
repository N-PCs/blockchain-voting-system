<?php
/**
 * Logger Service
 * 
 * @package VotingSystem\Services
 */

declare(strict_types=1);

namespace VotingSystem\Services;

use Monolog\Logger as MonologLogger;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\RotatingFileHandler;
use Monolog\Formatter\LineFormatter;
use Monolog\Processor\IntrospectionProcessor;
use Monolog\Processor\MemoryUsageProcessor;
use Monolog\Processor\WebProcessor;

class Logger
{
    /**
     * @var MonologLogger Monolog instance
     */
    private MonologLogger $logger;

    /**
     * @var array Log channels configuration
     */
    private static array $channels = [];

    /**
     * Constructor
     * 
     * @param string $channel Log channel name
     * @param string $logLevel Log level
     */
    public function __construct(string $channel = 'application', string $logLevel = null)
    {
        if (isset(self::$channels[$channel])) {
            $this->logger = self::$channels[$channel];
            return;
        }

        $level = $logLevel ?? ($_ENV['LOG_LEVEL'] ?? 'INFO');
        $logLevelConstant = constant('Monolog\Logger::' . strtoupper($level));

        // Create logger instance
        $this->logger = new MonologLogger($channel);

        // Add file handler (rotating daily)
        $logPath = $_ENV['LOG_PATH'] ?? __DIR__ . '/../../storage/logs';
        $logFile = $logPath . '/' . $channel . '.log';

        // Ensure log directory exists
        if (!is_dir($logPath)) {
            mkdir($logPath, 0755, true);
        }

        $fileHandler = new RotatingFileHandler($logFile, 7, $logLevelConstant);
        
        // Custom formatter
        $formatter = new LineFormatter(
            "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n",
            'Y-m-d H:i:s.u',
            true,
            true
        );
        
        $fileHandler->setFormatter($formatter);
        $this->logger->pushHandler($fileHandler);

        // Add console handler in development
        if ($_ENV['APP_ENV'] === 'development') {
            $consoleHandler = new StreamHandler('php://stdout', $logLevelConstant);
            $consoleHandler->setFormatter($formatter);
            $this->logger->pushHandler($consoleHandler);
        }

        // Add processors
        $this->logger->pushProcessor(new IntrospectionProcessor());
        $this->logger->pushProcessor(new MemoryUsageProcessor());
        
        if (PHP_SAPI !== 'cli') {
            $this->logger->pushProcessor(new WebProcessor());
        }

        // Store in channels cache
        self::$channels[$channel] = $this->logger;
    }

    /**
     * Log emergency message
     * 
     * @param string $message Log message
     * @param array $context Context data
     */
    public function emergency(string $message, array $context = []): void
    {
        $this->logger->emergency($message, $context);
    }

    /**
     * Log alert message
     * 
     * @param string $message Log message
     * @param array $context Context data
     */
    public function alert(string $message, array $context = []): void
    {
        $this->logger->alert($message, $context);
    }

    /**
     * Log critical message
     * 
     * @param string $message Log message
     * @param array $context Context data
     */
    public function critical(string $message, array $context = []): void
    {
        $this->logger->critical($message, $context);
    }

    /**
     * Log error message
     * 
     * @param string $message Log message
     * @param array $context Context data
     */
    public function error(string $message, array $context = []): void
    {
        $this->logger->error($message, $context);
    }

    /**
     * Log warning message
     * 
     * @param string $message Log message
     * @param array $context Context data
     */
    public function warning(string $message, array $context = []): void
    {
        $this->logger->warning($message, $context);
    }

    /**
     * Log notice message
     * 
     * @param string $message Log message
     * @param array $context Context data
     */
    public function notice(string $message, array $context = []): void
    {
        $this->logger->notice($message, $context);
    }

    /**
     * Log info message
     * 
     * @param string $message Log message
     * @param array $context Context data
     */
    public function info(string $message, array $context = []): void
    {
        $this->logger->info($message, $context);
    }

    /**
     * Log debug message
     * 
     * @param string $message Log message
     * @param array $context Context data
     */
    public function debug(string $message, array $context = []): void
    {
        $this->logger->debug($message, $context);
    }

    /**
     * Log with any level
     * 
     * @param mixed $level Log level
     * @param string $message Log message
     * @param array $context Context data
     */
    public function log($level, string $message, array $context = []): void
    {
        $this->logger->log($level, $message, $context);
    }

    /**
     * Get Monolog instance
     * 
     * @return MonologLogger Monolog logger
     */
    public function getMonologInstance(): MonologLogger
    {
        return $this->logger;
    }

    /**
     * Create a new logger instance for a specific channel
     * 
     * @param string $channel Channel name
     * @return self New logger instance
     */
    public static function channel(string $channel): self
    {
        return new self($channel);
    }
}