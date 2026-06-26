const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

async function fetchApi<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Event API
export const eventApi = {
  list: () => fetchApi<Event[]>("/api/events"),
  get: (id: string) => fetchApi<Event>(`/api/events/${id}`),
  create: (data: CreateEventInput) =>
    fetchApi<{ id: string }>("/api/events", { method: "POST", body: data }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/events/${id}`, { method: "DELETE" }),
  login: (data: LoginInput) =>
    fetchApi<LoginResponse>("/api/events/login", {
      method: "POST",
      body: data,
    }),
};

// Circle API
export const circleApi = {
  list: (eventId?: string) =>
    fetchApi<Circle[]>(`/api/circles${eventId ? `?eventId=${eventId}` : ""}`),
  get: (id: string) => fetchApi<Circle>(`/api/circles/${id}`),
  create: (data: CreateCircleInput) =>
    fetchApi<{ id: string }>("/api/circles", { method: "POST", body: data }),
  update: (id: string, data: UpdateCircleInput) =>
    fetchApi<{ success: boolean }>(`/api/circles/${id}`, {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/circles/${id}`, { method: "DELETE" }),
};

// Menu API
export const menuApi = {
  list: (circleId: string) =>
    fetchApi<MenuWithToppings[]>(`/api/menus?circleId=${circleId}`),
  get: (id: string) => fetchApi<MenuWithToppings>(`/api/menus/${id}`),
  create: (data: CreateMenuInput) =>
    fetchApi<{ id: string }>("/api/menus", { method: "POST", body: data }),
  update: (id: string, data: UpdateMenuInput) =>
    fetchApi<{ success: boolean }>(`/api/menus/${id}`, {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/menus/${id}`, { method: "DELETE" }),
  updateStock: (id: string, stock: number | null) =>
    fetchApi<{ success: boolean }>(`/api/menus/${id}/stock`, {
      method: "PATCH",
      body: { stock },
    }),
};

// Topping API
export const toppingApi = {
  list: (circleId: string) =>
    fetchApi<Topping[]>(`/api/toppings?circleId=${circleId}`),
  get: (id: string) => fetchApi<Topping>(`/api/toppings/${id}`),
  create: (data: CreateToppingInput) =>
    fetchApi<{ id: string }>("/api/toppings", { method: "POST", body: data }),
  update: (id: string, data: UpdateToppingInput) =>
    fetchApi<{ success: boolean }>(`/api/toppings/${id}`, {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/toppings/${id}`, { method: "DELETE" }),
};

// Staff API
export const staffApi = {
  list: (circleId: string) =>
    fetchApi<Staff[]>(`/api/staff?circleId=${circleId}`),
  get: (id: string) => fetchApi<Staff>(`/api/staff/${id}`),
  create: (data: CreateStaffInput) =>
    fetchApi<{ id: string }>("/api/staff", { method: "POST", body: data }),
  update: (id: string, data: UpdateStaffInput) =>
    fetchApi<{ success: boolean }>(`/api/staff/${id}`, {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/staff/${id}`, { method: "DELETE" }),
  getCurrentShift: (circleId: string) =>
    fetchApi<Staff[]>(`/api/staff/shift/current?circleId=${circleId}`),
  clockIn: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/staff/${id}/clock-in`, {
      method: "POST",
    }),
  clockOut: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/staff/${id}/clock-out`, {
      method: "POST",
    }),
};

// Order API
export const orderApi = {
  list: (circleId: string, status?: string) =>
    fetchApi<OrderWithItems[]>(
      `/api/orders?circleId=${circleId}${status ? `&status=${status}` : ""}`
    ),
  get: (id: string) => fetchApi<OrderWithItems>(`/api/orders/${id}`),
  getByOrderNumber: (circleId: string, orderNumber: string) =>
    fetchApi<Order>(
      `/api/orders/by-number/${orderNumber}?circleId=${circleId}`
    ),
  create: (data: CreateOrderInput) =>
    fetchApi<{ id: string; orderNumber: string }>("/api/orders", {
      method: "POST",
      body: data,
    }),
  updateStatus: (id: string, status: OrderStatus) =>
    fetchApi<{ success: boolean }>(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
  complete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/orders/${id}/complete`, {
      method: "POST",
    }),
  setEstimatedTime: (id: string, estimatedMinutes: number) =>
    fetchApi<{ success: boolean }>(`/api/orders/${id}/estimated-time`, {
      method: "PATCH",
      body: { estimatedMinutes },
    }),
  getSalesStats: (circleId: string, dateFrom?: string, dateTo?: string) => {
    let url = `/api/orders/stats/sales?circleId=${circleId}`;
    if (dateFrom) url += `&dateFrom=${dateFrom}`;
    if (dateTo) url += `&dateTo=${dateTo}`;
    return fetchApi<SalesStats>(url);
  },
};

// Membership API
export const membershipApi = {
  getRoles: () => fetchApi<RoleInfo[]>("/api/memberships/roles"),
  myMemberships: (userId: string) =>
    fetchApi<MembershipWithRelations[]>(`/api/memberships/my?userId=${userId}`),
  listByCircle: (circleId: string) =>
    fetchApi<MembershipWithUser[]>(`/api/memberships/circle/${circleId}`),
  listByEvent: (eventId: string) =>
    fetchApi<MembershipWithUser[]>(`/api/memberships/event/${eventId}`),
  checkPermission: (data: CheckPermissionInput) =>
    fetchApi<CheckPermissionResult>("/api/memberships/check-permission", {
      method: "POST",
      body: data,
    }),
  addMember: (data: AddMemberInput) =>
    fetchApi<{ id: string }>("/api/memberships", {
      method: "POST",
      body: data,
    }),
  updateRole: (id: string, role: Role) =>
    fetchApi<{ success: boolean }>(`/api/memberships/${id}/role`, {
      method: "PATCH",
      body: { role },
    }),
  deactivate: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/memberships/${id}/deactivate`, {
      method: "PATCH",
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/memberships/${id}`, {
      method: "DELETE",
    }),
  createInvite: (data: CreateInviteInput) =>
    fetchApi<{ token: string; expiresAt: Date }>("/api/memberships/invite", {
      method: "POST",
      body: data,
    }),
  acceptInvite: (data: AcceptInviteInput) =>
    fetchApi<{ membershipId: string }>("/api/memberships/invite/accept", {
      method: "POST",
      body: data,
    }),
  listInvites: (circleId?: string, eventId?: string) => {
    const params = circleId
      ? `circleId=${circleId}`
      : eventId
      ? `eventId=${eventId}`
      : "";
    return fetchApi<InviteToken[]>(`/api/memberships/invite/list?${params}`);
  },
  deleteInvite: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/memberships/invite/${id}`, {
      method: "DELETE",
    }),
  authenticateWithPin: (data: PinAuthInput) =>
    fetchApi<PinAuthResult>("/api/memberships/authenticate-pin", {
      method: "POST",
      body: data,
    }),
  updatePin: (id: string, pin: string) =>
    fetchApi<{ success: boolean }>(`/api/memberships/${id}/pin`, {
      method: "PATCH",
      body: { pin },
    }),
};

// 画像アップロード
export const uploadImage = async (
  file: File
): Promise<{ path: string; fileName: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "アップロードに失敗しました");
  }

  return response.json();
};

// Types
export interface Event {
  id: string;
  eventName: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

export interface Circle {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  iconImagePath: string | null;
  backgroundImagePath: string | null;
}

export interface Menu {
  id: string;
  circleId: string;
  name: string;
  price: number;
  description: string | null;
  imagePath: string | null;
  stockQuantity: number | null;
  soldOut: boolean;
}

export interface Topping {
  id: string;
  circleId: string;
  name: string;
  price: number;
  description: string | null;
  soldOut: boolean;
}

export interface MenuWithToppings extends Menu {
  toppings: Topping[];
}

export interface Staff {
  id: string;
  circleId: string;
  name: string;
  shiftStart: Date | null;
  shiftEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface Order {
  id: string;
  circleId: string;
  staffId: string | null;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  notes: string | null;
  estimatedMinutes: number | null;
  createdAt: Date | null;
  completedAt: Date | null;
}

export interface OrderItemTopping {
  id: string;
  orderItemId: string;
  toppingId: string;
  toppingName: string;
  price: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuId: string;
  menuName: string;
  quantity: number;
  menuPrice: number;
  toppings?: OrderItemTopping[];
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface SalesStats {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
}

export type Role =
  | "event_admin"
  | "circle_manager"
  | "cashier"
  | "kitchen_staff"
  | "waiter"
  | "stock_manager"
  | "viewer";

export interface RoleInfo {
  role: Role;
  permissions: string[];
}

export interface Membership {
  id: string;
  userEmail: string;
  userName: string;
  circleId: string | null;
  eventId: string | null;
  role: string;
  pin: string | null;
  isActive: boolean;
  invitedAt: Date | null;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipWithRelations extends Membership {
  circle?: Circle;
  event?: Event;
}

// MembershipWithUser is now the same as Membership since userName/userEmail are included
export type MembershipWithUser = Membership;

export interface InviteToken {
  id: string;
  token: string;
  circleId: string | null;
  eventId: string | null;
  role: string;
  expiresAt: Date;
  maxUses: number | null;
  usedCount: number;
}

// Input Types
export interface LoginInput {
  eventName: string;
  circleName: string;
  password: string;
}

export interface LoginResponse {
  circleId: string;
  circleName: string;
  eventId: string;
  eventName: string;
}

export interface CreateEventInput {
  eventName: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateCircleInput {
  eventId: string;
  name: string;
  password: string;
  description?: string;
}

export interface UpdateCircleInput {
  name?: string;
  description?: string;
  password?: string;
}

export interface CreateMenuInput {
  circleId: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  stock?: number;
  isAvailable?: boolean;
  toppingIds?: string[];
}

export interface UpdateMenuInput {
  name?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  stock?: number | null;
  isAvailable?: boolean;
  toppingIds?: string[];
}

export interface CreateToppingInput {
  circleId: string;
  name: string;
  price: number;
  stock?: number;
  isAvailable?: boolean;
}

export interface UpdateToppingInput {
  name?: string;
  price?: number;
  stock?: number | null;
  isAvailable?: boolean;
}

export interface CreateStaffInput {
  circleId: string;
  name: string;
}

export interface UpdateStaffInput {
  name?: string;
}

export interface CreateOrderInput {
  circleId: string;
  staffId?: string;
  peopleCount?: number;
  items: {
    menuId: string;
    quantity: number;
    toppingIds?: string[];
  }[];
  notes?: string;
}

export interface CheckPermissionInput {
  userId: string;
  circleId?: string;
  eventId?: string;
  permission: string;
}

export interface CheckPermissionResult {
  hasPermission: boolean;
  role?: string;
}

export interface AddMemberInput {
  userEmail: string;
  userName: string;
  circleId?: string;
  eventId?: string;
  role: Role;
  pin?: string;
}

export interface CreateInviteInput {
  circleId?: string;
  eventId?: string;
  role: Role;
  expiresInHours?: number;
  maxUses?: number;
}

export interface AcceptInviteInput {
  token: string;
  userEmail: string;
  userName: string;
  pin?: string;
}

export interface PinAuthInput {
  circleId?: string;
  eventId?: string;
  pin: string;
}

export interface PinAuthResult {
  success: boolean;
  membership?: Membership;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}
