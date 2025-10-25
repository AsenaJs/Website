---
title: Philosophy
description: Why Asena exists and what problems it solves
outline: deep
---

# Philosophy

`Spring Boot` and `Quarkus` have established proven patterns for enterprise application development, but developers transitioning to TypeScript often find themselves reimplementing familiar concepts or adapting to unfamiliar architectures. `AsenaJS` addresses this gap by bringing automatic component discovery, field-based dependency injection to the `Bun` ecosystem.

The framework eliminates boilerplate through automatic scanning of decorator-annotated classes, removing the need for explicit module declarations or manual wiring. Components marked with `@Controller`, `@Service`, or `@Repository` (via asena-drizzle package) are discovered and registered automatically, allowing developers to focus on business logic rather than configuration. This approach, combined with Bun's native performance characteristics, delivers both the familiar developer experience of Spring Boot and the speed expected from modern JavaScript runtimes.

`AsenaJS` is designed to make developers familiar with `Spring Boot` and `Quarkus` feel at home in the TypeScript ecosystem. As the framework evolves, we remain committed to this philosophy—bringing more proven patterns from the Java world while maintaining the performance advantages that `Bun` provides and flexiblity of Typescript.
