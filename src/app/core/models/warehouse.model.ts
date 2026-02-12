export interface Warehouse {
    id: number;
    name: string;
    address?: string;
    type: 'factory' | 'pos';
}
