# ADR 001: Modular monolith

Context: four related MVP domains are operated by one developer. Decision: one deployment with Clean Architecture per module. Consequences: simple operations and explicit boundaries; scaling remains coarse-grained. Alternatives rejected: microservices add operational cost without a current need.
