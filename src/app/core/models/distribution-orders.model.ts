export interface DistributionOrder {
    id?: number;
    order_number: string;
    dispatch_document_number?: string;
    origin_location_id: number;
    origin_location_name: string;
    destination_location_name: string;
    date_created: Date | string;
    date_received?: Date | string;
    status: 'pending' | 'exported' | 'received' | 'cancelled';
    lines: DistributionLine[];
    notes?: string;
    received_by?: string;
    reception_notes?: string;
    created_by?: string;
    checksum?: string;
}

export interface DistributionLine {
    id?: number;
    distribution_order_id?: number;
    product_id: number;
    product_name: string;
    product_code: string;
    quantity_sent: number;
    quantity_received?: number;
    unit_cost: number;
    difference_reason?: string;
}

export interface DistributionExportData {
    version: string;
    distribution_order: {
        order_number: string;
        dispatch_document_number?: string;
        origin: string;
        destination: string;
        date_created: Date | string;
        lines: {
            product_code: string;
            product_name: string;
            quantity: number;
            unit_cost: number;
        }[];
        total_items: number;
        notes: string;
        checksum: string;
    };
}

export interface DistributionImportRequest {
    distribution_data: DistributionExportData;
    dispatch_document_number?: string;
    location_id: number;
    received_by: string;
    reception_notes?: string;
}
