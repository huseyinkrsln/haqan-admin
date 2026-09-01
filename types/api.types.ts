// ─── Auth ───────────────────────────────────────────────────────────────────

export interface AccessToken {
  claims: string[];
  token: string;
  expiration: string; // ISO datetime string
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: AccessToken;
}

// ─── Base ────────────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  status?: boolean;
}

// ─── Colors ──────────────────────────────────────────────────────────────────

export interface Color extends BaseEntity {
  name: string;
  hexCode: string;
}

export type CreateColorDto = Pick<Color, "name" | "hexCode">;
export type UpdateColorDto = Pick<Color, "id" | "name" | "hexCode">;

// ─── Size Groups ─────────────────────────────────────────────────────────────

export interface SizeGroup extends BaseEntity {
  name: string;
  sizes?: Size[];
}

export type CreateSizeGroupDto = Pick<SizeGroup, "name">;
export type UpdateSizeGroupDto = Pick<SizeGroup, "id" | "name">;

// ─── Sizes ───────────────────────────────────────────────────────────────────

export interface Size extends BaseEntity {
  name: string;
  sizeGroupId: number;
  sizeGroupName?: string;
  sizeGroup?: string; // backwards compatibility
}

export interface CreateSizeDto {
  name: string;
  sizeGroupId: number;
}

export interface UpdateSizeDto {
  id: number;
  name: string;
  sizeGroupId: number;
}

// ─── Brands ──────────────────────────────────────────────────────────────────

export interface Brand extends BaseEntity {
  name: string;
  logoUrl?: string;
}

export interface CreateBrandDto extends Pick<Brand, "name" | "logoUrl"> {
  logo?: File;
}

export interface UpdateBrandDto extends Pick<Brand, "id" | "name" | "logoUrl"> {
  logo?: File;
}

// ─── Features ────────────────────────────────────────────────────────────────

export interface Feature extends BaseEntity {
  name: string;
  icon?: string;
}

export interface CreateFeatureDto extends Pick<Feature, "name" | "icon"> {
  iconFile?: File;
}

export interface UpdateFeatureDto extends Pick<Feature, "id" | "name" | "icon"> {
  iconFile?: File;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface Category extends BaseEntity {
  name: string;
  parentCategoryId?: number;
  description?: string;
  imageUrl1?: string;
  imageUrl2?: string;
  slug: string;
  sizeGroupId?: number | null;
  sizeGroupName?: string;
}

export interface CreateCategoryDto extends Pick<Category, "name" | "parentCategoryId" | "description" | "slug" | "sizeGroupId"> {
  image1?: File;
  image2?: File;
}

export interface UpdateCategoryDto extends Pick<Category, "id" | "name" | "parentCategoryId" | "description" | "slug" | "sizeGroupId"> {
  image1?: File;
  image2?: File;
}

export interface SizeLookupDto {
  id: number;
  name: string;
}

export interface SizeGroupWithSizesLookupDto {
  id: number;
  name: string;
  sizes: SizeLookupDto[];
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface AdminUser extends BaseEntity {
  fullName: string;
  email: string;
  mobilePhones?: string;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  categoryId: number;
  productGroupId?: number;
  brandId?: number;
  description: string;
  basePrice: number;
  discountPrice?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  discountRequirementType?: string;
  discountRequirementValue?: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  displayOrder: number;
  slug: string;
  features?: Feature[];
  featureIds?: number[];
  totalStock?: number;
  variantCount?: number;
  primaryImageUrl?: string;
  categoryName?: string;
}

export interface UpdateProductDto {
  id: number;
  name: string;
  categoryId: number;
  productGroupId?: number;
  brandId?: number;
  description: string;
  basePrice: number;
  discountPrice?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  displayOrder: number;
  slug: string;
  featureIds?: number[];
}

export interface ProductVariant {
  id: number;
  productColorId: number;
  sizeId: number;
  sku?: string;
  barcode?: string;
  stockQuantity: number;
  priceDifference: number;
}

export interface ProductImage {
  id: number;
  productColorId: number;
  imageUrl: string;
  displayOrder: number;
  isMain: boolean;
  isProductMain: boolean;
}

export interface ProductColor {
  id: number;
  productId: number;
  colorId: number;
}

// Wizard için Varyant DTO
export interface ProductVariantCreateDto {
  colorId: number;
  sizeId: number;
  sku?: string;
  barcode?: string;
  stockQuantity: number;
  priceDifference: number;
}

// Wizard için Görsel DTO
export interface ProductImageCreateDto {
  colorId: number;
  imageUrl: string;
  displayOrder: number;
  isMain: boolean;
  isProductMain: boolean;
}

// Backend'e gönderilecek tam complex ürün payload'ı
export interface CreateComplexProductDto {
  name: string;
  categoryId: number;
  productGroupId?: number;
  brandId?: number;
  description: string;
  basePrice: number;
  discountPrice?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  discountRequirementType?: string;
  discountRequirementValue?: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  displayOrder: number;
  slug: string;
  variants: ProductVariantCreateDto[];
  images: ProductImageCreateDto[];
  featureIds?: number[];
}

// Pagination yapısı (backend PaginatedResult<T>)
export interface PaginatedResult<T> {
  data: T;
  success: boolean;
  message: string;
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  firstPage?: number;
  lastPage?: number;
  nextPage?: number;
  previousPage?: number;
}

// ─── Delete Payloads ─────────────────────────────────────────────────────────
// Backend DELETE endpoint'leri [FromBody] ile id beklediği için

export interface DeletePayload {
  id: number;
}

// ─── Orders & OrderItems ──────────────────────────────────────────────────────

export enum OrderStatusEnum {
  All = 0,
  Pending = 1,
  Processing = 2,
  Shipped = 3,
  Delivered = 4,
  Cancelled = 5,
}

export interface OrderCounts {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface Order extends BaseEntity {
  orderNumber: string;
  userId: number;
  shippingCarrierId: number;
  orderDate: string;
  estimatedDeliveryDate?: string;
  totalAmount: number;
  orderStatus: string; // "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
  trackingNumber?: string;
  shippingFullName: string;
  shippingPhoneNumber: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string;
  shippingCountry: string;
  shippingCity: string;
  shippingDistrict: string;
  billingFullName: string;
  billingPhoneNumber: string;
  billingAddressLine1: string;
  billingAddressLine2?: string;
  billingCountry: string;
  billingCity: string;
  billingDistrict: string;
  orderItems?: OrderItem[];
}

export interface OrderItem extends BaseEntity {
  orderId: number;
  productVariantId: number;
  quantity: number;
  unitPrice: number;
  productId?: number;
  productName?: string;
  productCode?: string;
  colorName?: string;
  colorHexCode?: string;
  sizeName?: string;
  sku?: string;
  imageUrl?: string;
  returnStatus?: string;
  returnReason?: string;
  returnDate?: string;
  refundedAmount?: number;
  variantInfo?: string;
}

export type UpdateOrderDto = Order;

// ─── Coupons ─────────────────────────────────────────────────────────────────

export interface Coupon extends BaseEntity {
  code: string;
  discountType: "Percentage" | "FixedAmount" | string;
  value: number;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  isShowcase?: boolean;
  usageLimit?: number | null;
  usageCount?: number;
  isSingleUsePerUser?: boolean;
}

export interface CreateCouponDto {
  code: string;
  discountType: string;
  value: number;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  isShowcase?: boolean;
  usageLimit?: number | null;
  isSingleUsePerUser?: boolean;
}

export interface UpdateCouponDto extends CreateCouponDto {
  id: number;
}

// ─── Sliders ─────────────────────────────────────────────────────────────────

export interface Slider extends BaseEntity {
  title?: string;
  subTitle?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  targetUrl?: string;
  buttonText?: string;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
}

export interface CreateSliderDto {
  title?: string;
  subTitle?: string;
  targetUrl?: string;
  buttonText?: string;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
  image?: File;
  mobileImage?: File;
}

export interface UpdateSliderDto extends CreateSliderDto {
  id: number;
  imageUrl?: string;
  mobileImageUrl?: string;
}

// ─── Shipping Carriers ───────────────────────────────────────────────────────

export interface ShippingCarrier extends BaseEntity {
  name: string;
  basePrice?: number;
  trackingUrlTemplate?: string;
}

// ─── Stock Movements ─────────────────────────────────────────────────────────

export enum StockMovementType {
  All = 0,
  In = 1,
  Out = 2,
  Order = 3,
  Return = 4,
  Adjustment = 5,
  Waste = 6,
}

export enum StockMovementReferenceType {
  SupplierReceipt = 1,
  Order = 2,
  OrderReturn = 3,
  Audit = 4,
  Waste = 5,
  Manual = 6,
}

export interface StockMovement extends BaseEntity {
  productVariantId: number;
  movementType: string | StockMovementType;
  quantity: number;
  previousStock: number;
  currentStock: number;
  referenceType?: string | StockMovementReferenceType;
  referenceId?: string | number;
  note?: string;
  userId?: number;
  createdDate?: string;
  productId?: number;
  productName?: string;
  productImageUrl?: string;
  colorName?: string;
  colorHexCode?: string;
  sizeName?: string;
  sku?: string;
  barcode?: string;
}

// ─── Carts ───────────────────────────────────────────────────────────────────

export interface Cart extends BaseEntity {
  cartToken: string;
  userId?: number;
  userFullName?: string;
  userEmail?: string;
  expiresAt: string;
}

export interface CartItem extends BaseEntity {
  cartId: number;
  productVariantId: number;
  quantity: number;
  productId?: number;
  productName?: string;
  productCode?: string;
  colorName?: string;
  colorHexCode?: string;
  sizeName?: string;
  sku?: string;
  imageUrl?: string;
  price?: number;
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export interface ProductFavorite extends BaseEntity {
  userId: number;
  productId: number;
  productName?: string;
  imageUrl?: string;
  price?: number;
  userFullName?: string;
  userEmail?: string;
  createdDate?: string;
}

// ─── Roles & Permissions ─────────────────────────────────────────────────────

export interface Role extends BaseEntity {
  groupName?: string;
  GroupName?: string;
}

export interface OperationClaim extends BaseEntity {
  name?: string;
  alias?: string;
  description?: string;
}

export interface GroupClaim extends BaseEntity {
  groupId: number;
  claimId: number;
}

export interface SelectionItem {
  id: string | number;
  label: string;
  parentId?: string;
  isDisabled?: boolean;
}

// ─── Product Groups (Ürün Grupları) ──────────────────────────────────────────

export interface ProductGroup extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  categoryId?: number;
  categoryName?: string;
}

export interface CreateProductGroupDto {
  name: string;
  slug: string;
  description?: string;
  categoryId?: number;
  image?: File;
  file?: File;
}

export interface UpdateProductGroupDto extends Partial<CreateProductGroupDto> {
  id: number;
  imageUrl?: string;
}

// ─── Complaint & Suggestions (Şikayet & Öneri) ──────────────────────────────

export enum FeedbackType {
  Complaint = 1,  // Şikayet
  Suggestion = 2, // Öneri
  Request = 3,    // Talep / İstek
  Other = 4       // Diğer
}

export enum FeedbackStatus {
  Pending = 1,    // Beklemede
  InReview = 2,   // İnceleniyor
  Resolved = 3,   // Çözüldü / Yanıtlandı
  Rejected = 4    // Reddedildi / Kapatıldı
}

export interface ComplaintSuggestion extends BaseEntity {
  type: FeedbackType | number | string;
  typeName?: string;
  processStatus: FeedbackStatus | number | string;
  processStatusName?: string;
  userId?: number;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  subject: string;
  message: string;
  orderId?: number;
  createdDate?: string;
  adminNote?: string;
  resolvedDate?: string;
}

export interface ComplaintSuggestionStats {
  totalCount: number;
  pendingCount: number;
  inReviewCount: number;
  resolvedCount: number;
  rejectedCount: number;
  complaintCount: number;
  suggestionCount: number;
  requestCount: number;
  otherCount: number;
}

export interface ComplaintSuggestionPaginationResponse {
  items: ComplaintSuggestion[];
  totalRecords: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  stats: ComplaintSuggestionStats;
}

export interface UpdateComplaintSuggestionStatusDto {
  id: number;
  processStatus: FeedbackStatus | number;
  adminNote?: string;
}

// ─── Site Settings (Site Ayarları) ──────────────────────────────────────────

export interface SiteSetting extends BaseEntity {
  settingKey: string;
  settingValue?: string;
  groupKey?: string;
  description?: string;
}

export interface CreateSiteSettingDto {
  settingKey: string;
  settingValue?: string;
  groupKey?: string;
  description?: string;
}

export interface UpdateSiteSettingDto {
  id: number;
  settingKey: string;
  settingValue?: string;
  groupKey?: string;
  description?: string;
}

export interface SiteSettingBulkItemDto {
  settingKey: string;
  settingValue?: string;
  groupKey?: string;
  description?: string;
}

export interface BulkUpdateSiteSettingDto {
  settings: SiteSettingBulkItemDto[];
}

