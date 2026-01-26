export interface CompoundProduct {
    id?: number;
    idproduct: number;
    idinsumo: number;
    cantidad: number;
    unidadproduct: string;
    unidadinsumo: string;
    nameinsumo: string;
}

export interface CompoundProductDetail extends CompoundProduct {
    product_name?: string;
    insumo_name?: string;
    unidad_product_name?: string;
    unidad_insumo_name?: string;
}

export interface ProductForCompound {
    id: number;
    name: string;
    reference: string;
    code: string;
    codeunit: string;
    typeproduct?: string;
}

export interface Unidad {
    code: string;
    name: string;
}

export interface StockValidation {
    hasStock: boolean;
    message: string;
    details: Array<{
        insumoId: number;
        requiredQuantity: number;
        currentStock: number;
        hasEnough: boolean;
    }>;
}
