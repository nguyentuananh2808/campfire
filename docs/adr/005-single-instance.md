# ADR 005: Initial single instance

Context: the private pilot has modest load. Decision: run one API instance initially. Consequences: in-memory connection revocation works locally; multiple replicas later require a backplane and distributed revocation. Alternative rejected: premature distributed infrastructure.
