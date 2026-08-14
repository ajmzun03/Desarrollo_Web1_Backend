CREATE TYPE "estado_lote" AS ENUM('VIGENTE', 'VENCIDO', 'AGOTADO');--> statement-breakpoint
CREATE TABLE "bodega" (
	"id" integer PRIMARY KEY,
	"sucursal_id" integer NOT NULL,
	"bodega" varchar(100) NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "categoria" (
	"id" integer PRIMARY KEY,
	"categoria_id" integer NOT NULL UNIQUE,
	"descripcion" varchar(100) NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cliente" (
	"id" bigint PRIMARY KEY,
	"nombre" varchar(100) NOT NULL,
	"apellido" varchar(100) NOT NULL,
	"telefono" varchar(50) NOT NULL UNIQUE,
	"telefono_ref" varchar(50) NOT NULL UNIQUE,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departamento" (
	"id" integer PRIMARY KEY,
	"departamento" varchar(100) NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "direccion" (
	"id" integer PRIMARY KEY,
	"cliente_id" bigint NOT NULL,
	"municipio_id" integer NOT NULL,
	"direccion" varchar(155) NOT NULL,
	"direccion2" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kardex_bodega" (
	"id" bigint PRIMARY KEY,
	"bodega_id" integer NOT NULL,
	"lote_id" bigint NOT NULL,
	"tipo_movimiento" varchar(50) NOT NULL,
	"cantidad" double precision NOT NULL,
	"fecha_movimiento" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lote_materia_prima" (
	"id" bigint PRIMARY KEY,
	"materia_prima_id" integer NOT NULL,
	"fecha_vencimiento" date NOT NULL,
	"cantidad_inicial" double precision NOT NULL,
	"cantidad_actual" double precision NOT NULL,
	"estado" "estado_lote" DEFAULT 'VIGENTE'::"estado_lote" NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materia_prima" (
	"id" integer PRIMARY KEY,
	"categoria_id" integer NOT NULL,
	"unidad_medida_id" integer NOT NULL,
	"materia_prima" varchar(150) NOT NULL,
	"es_perecedera" boolean DEFAULT false NOT NULL,
	"maneja_merma" boolean DEFAULT false NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "municipio" (
	"id" integer PRIMARY KEY,
	"departamento_id" integer NOT NULL,
	"municipio" varchar(100) NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "stock_bodega" (
	"id" integer PRIMARY KEY,
	"bodega_id" integer NOT NULL,
	"lote_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sucursal" (
	"id" integer PRIMARY KEY,
	"municipio_id" integer NOT NULL,
	"sucursal" varchar(100) NOT NULL UNIQUE,
	"direccion" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "unidad_medida" (
	"id" integer PRIMARY KEY,
	"unidad" varchar(50) NOT NULL,
	"abreviatura" varchar(4) NOT NULL UNIQUE,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proveedor" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
DROP SEQUENCE "proveedor_id_seq";--> statement-breakpoint
ALTER TABLE "proveedor" ALTER COLUMN "id" SET DATA TYPE integer USING "id"::integer;