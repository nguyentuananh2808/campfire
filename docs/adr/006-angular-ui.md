# ADR 006: Angular UI

Context: the product is mobile-first and small enough for local state. Decision: Angular 22 standalone/lazy components, signals plus RxJS, semantic HTML and project SCSS tokens; no NgRx initially. Consequences: low dependency overhead. Alternative rejected: a global store before demonstrated need.
