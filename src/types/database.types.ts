
export interface Employee {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  branch_id: string;
  salary: number;
}

export interface InventoryItem {
  id: string;
  created_at: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  branch_id: string;
}

export interface Branch {
  id: string;
  created_at: string;
  name: string;
  address: string;
  phone: string;
  manager_id: string;
}

export interface Sale {
  id: string;
  created_at: string;
  item_id: string;
  quantity: number;
  total_amount: number;
  employee_id: string;
  branch_id: string;
}

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: Employee;
        Insert: Omit<Employee, 'id' | 'created_at'>;
        Update: Partial<Omit<Employee, 'id' | 'created_at'>>;
      };
      inventory: {
        Row: InventoryItem;
        Insert: Omit<InventoryItem, 'id' | 'created_at'>;
        Update: Partial<Omit<InventoryItem, 'id' | 'created_at'>>;
      };
      branches: {
        Row: Branch;
        Insert: Omit<Branch, 'id' | 'created_at'>;
        Update: Partial<Omit<Branch, 'id' | 'created_at'>>;
      };
      sales: {
        Row: Sale;
        Insert: Omit<Sale, 'id' | 'created_at'>;
        Update: Partial<Omit<Sale, 'id' | 'created_at'>>;
      };
    };
  };
}
