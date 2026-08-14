CREATE TABLE "proveedor" (
	"id" serial PRIMARY KEY,
	"no_nit" varchar(13) NOT NULL UNIQUE,
	"proveedor" varchar(150) NOT NULL UNIQUE,
	"direccion" varchar(255)
);
