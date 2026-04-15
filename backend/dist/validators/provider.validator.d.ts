import { z } from 'zod';
export declare const createProviderSchema: z.ZodObject<{
    businessName: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    region: z.ZodString;
    city: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    website: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    services: z.ZodArray<z.ZodObject<{
        category: z.ZodNativeEnum<{
            PINTURA: "PINTURA";
            SOLDADURA: "SOLDADURA";
            ELECTRICO: "ELECTRICO";
            MANTENIMIENTO: "MANTENIMIENTO";
            LIMPIEZA: "LIMPIEZA";
            GASFITERIA: "GASFITERIA";
            CLIMATIZACION: "CLIMATIZACION";
            CONSTRUCCION: "CONSTRUCCION";
            OTRO: "OTRO";
        }>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        priceFrom: z.ZodOptional<z.ZodNumber>;
        priceTo: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        category: "PINTURA" | "SOLDADURA" | "ELECTRICO" | "MANTENIMIENTO" | "LIMPIEZA" | "GASFITERIA" | "CLIMATIZACION" | "CONSTRUCCION" | "OTRO";
        title: string;
        description?: string | undefined;
        priceFrom?: number | undefined;
        priceTo?: number | undefined;
    }, {
        category: "PINTURA" | "SOLDADURA" | "ELECTRICO" | "MANTENIMIENTO" | "LIMPIEZA" | "GASFITERIA" | "CLIMATIZACION" | "CONSTRUCCION" | "OTRO";
        title: string;
        description?: string | undefined;
        priceFrom?: number | undefined;
        priceTo?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    businessName: string;
    region: string;
    services: {
        category: "PINTURA" | "SOLDADURA" | "ELECTRICO" | "MANTENIMIENTO" | "LIMPIEZA" | "GASFITERIA" | "CLIMATIZACION" | "CONSTRUCCION" | "OTRO";
        title: string;
        description?: string | undefined;
        priceFrom?: number | undefined;
        priceTo?: number | undefined;
    }[];
    description?: string | undefined;
    website?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
}, {
    businessName: string;
    region: string;
    services: {
        category: "PINTURA" | "SOLDADURA" | "ELECTRICO" | "MANTENIMIENTO" | "LIMPIEZA" | "GASFITERIA" | "CLIMATIZACION" | "CONSTRUCCION" | "OTRO";
        title: string;
        description?: string | undefined;
        priceFrom?: number | undefined;
        priceTo?: number | undefined;
    }[];
    description?: string | undefined;
    website?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
}>;
export declare const updateProviderSchema: z.ZodObject<{
    businessName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    region: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    website: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    services: z.ZodOptional<z.ZodArray<z.ZodObject<{
        category: z.ZodNativeEnum<{
            PINTURA: "PINTURA";
            SOLDADURA: "SOLDADURA";
            ELECTRICO: "ELECTRICO";
            MANTENIMIENTO: "MANTENIMIENTO";
            LIMPIEZA: "LIMPIEZA";
            GASFITERIA: "GASFITERIA";
            CLIMATIZACION: "CLIMATIZACION";
            CONSTRUCCION: "CONSTRUCCION";
            OTRO: "OTRO";
        }>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        priceFrom: z.ZodOptional<z.ZodNumber>;
        priceTo: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        category: "PINTURA" | "SOLDADURA" | "ELECTRICO" | "MANTENIMIENTO" | "LIMPIEZA" | "GASFITERIA" | "CLIMATIZACION" | "CONSTRUCCION" | "OTRO";
        title: string;
        description?: string | undefined;
        priceFrom?: number | undefined;
        priceTo?: number | undefined;
    }, {
        category: "PINTURA" | "SOLDADURA" | "ELECTRICO" | "MANTENIMIENTO" | "LIMPIEZA" | "GASFITERIA" | "CLIMATIZACION" | "CONSTRUCCION" | "OTRO";
        title: string;
        description?: string | undefined;
        priceFrom?: number | undefined;
        priceTo?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    businessName?: string | undefined;
    description?: string | undefined;
    website?: string | undefined;
    region?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
    services?: {
        category: "PINTURA" | "SOLDADURA" | "ELECTRICO" | "MANTENIMIENTO" | "LIMPIEZA" | "GASFITERIA" | "CLIMATIZACION" | "CONSTRUCCION" | "OTRO";
        title: string;
        description?: string | undefined;
        priceFrom?: number | undefined;
        priceTo?: number | undefined;
    }[] | undefined;
}, {
    businessName?: string | undefined;
    description?: string | undefined;
    website?: string | undefined;
    region?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
    services?: {
        category: "PINTURA" | "SOLDADURA" | "ELECTRICO" | "MANTENIMIENTO" | "LIMPIEZA" | "GASFITERIA" | "CLIMATIZACION" | "CONSTRUCCION" | "OTRO";
        title: string;
        description?: string | undefined;
        priceFrom?: number | undefined;
        priceTo?: number | undefined;
    }[] | undefined;
}>;
export declare const providerFiltersSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodNativeEnum<{
        PINTURA: "PINTURA";
        SOLDADURA: "SOLDADURA";
        ELECTRICO: "ELECTRICO";
        MANTENIMIENTO: "MANTENIMIENTO";
        LIMPIEZA: "LIMPIEZA";
        GASFITERIA: "GASFITERIA";
        CLIMATIZACION: "CLIMATIZACION";
        CONSTRUCCION: "CONSTRUCCION";
        OTRO: "OTRO";
    }>>;
    region: z.ZodOptional<z.ZodString>;
    minScore: z.ZodOptional<z.ZodNumber>;
    orderBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["score", "createdAt", "name"]>>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    orderBy: "name" | "createdAt" | "score";
    page: number;
    limit: number;
    region?: string | undefined;
    category?: "PINTURA" | "SOLDADURA" | "ELECTRICO" | "MANTENIMIENTO" | "LIMPIEZA" | "GASFITERIA" | "CLIMATIZACION" | "CONSTRUCCION" | "OTRO" | undefined;
    search?: string | undefined;
    minScore?: number | undefined;
}, {
    region?: string | undefined;
    category?: "PINTURA" | "SOLDADURA" | "ELECTRICO" | "MANTENIMIENTO" | "LIMPIEZA" | "GASFITERIA" | "CLIMATIZACION" | "CONSTRUCCION" | "OTRO" | undefined;
    search?: string | undefined;
    minScore?: number | undefined;
    orderBy?: "name" | "createdAt" | "score" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
