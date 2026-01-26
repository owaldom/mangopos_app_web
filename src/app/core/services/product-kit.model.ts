export interface KitComponent {
    id?: number;
    kit_id?: number;
    component_id: number;
    quantity: number;
    group_id?: number;
    group_name?: string;
    is_mandatory?: boolean;

    // Extra fields from join
    component_name?: string;
    component_reference?: string;
    component_code?: string;
    component_price?: number;
}

export interface KitHeader {
    id: number;
    name: string;
    reference: string;
    code: string;
    pricesell: number;
}
