<?php

declare(strict_types=1);

namespace Afyalink\Core\Http;

use Afyalink\Core\Support\Exceptions\NotFoundException;

final class Router
{
    /** @var list<array{method: string, pattern: string, handler: callable(Request): array<string, mixed>}> */
    private array $routes = [];

    /**
     * @param callable(Request): array<string, mixed> $handler
     */
    public function add(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function dispatch(Request $request): array
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method) {
                continue;
            }

            $params = $this->match($route['pattern'], $request->path);
            if ($params === null) {
                continue;
            }

            $request->params = $params;

            return ($route['handler'])($request);
        }

        throw new NotFoundException('Endpoint not found.');
    }

    /**
     * @return array<string, string>|null
     */
    private function match(string $pattern, string $path): ?array
    {
        $names = [];
        $regex = preg_replace_callback('/\{([A-Za-z_][A-Za-z0-9_]*)\}/', function (array $matches) use (&$names): string {
            $names[] = $matches[1];

            return '([^/]+)';
        }, $pattern);

        if ($regex === null) {
            return null;
        }

        if (!preg_match('#^' . $regex . '$#', $path, $matches)) {
            return null;
        }

        $params = [];
        foreach ($names as $index => $name) {
            $params[$name] = $matches[$index + 1];
        }

        return $params;
    }
}
