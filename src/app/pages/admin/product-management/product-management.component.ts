import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, ProductStats, Category } from '../../../core/services/product.service';
import { FileUploadServiceProxy, FileParameter } from '../../../core/services/service-proxies';
import { TenantService } from '../../../core/services/tenant.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-product-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './product-management.component.html',
    styleUrls: ['./product-management.component.scss']
})
export class ProductManagementComponent implements OnInit {
    products: Product[] = [];
    filteredProducts: Product[] = [];
    categories: Category[] = [];
    stats: ProductStats | null = null;

    selectedProduct: Product | null = null;
    isModalOpen = false;
    isEditMode = false;

    searchTerm = '';
    selectedCategory = '';
    selectedStatus = '';

    // Form fields
    productForm: Partial<Product> = this.getEmptyProduct();

    // Category management
    isCategoryModalOpen = false;
    categoryForm: Partial<Category> = { name: '', description: '', isActive: true };
    categoryError = '';

    // Image upload
    uploadingImageIndex: number | null = null;

    constructor(
        private productService: ProductService,
        private fileUploadService: FileUploadServiceProxy,
        private tenantService: TenantService
    ) {}

    ngOnInit(): void {
        this.loadProducts();
        this.loadCategories();
        this.loadStats();
    }

    loadProducts(): void {
        this.productService.getProducts().subscribe({
            next: (data) => {
                this.products = data;
                this.applyFilters();
            },
            error: (_error: any) => {
                console.error('Error loading products');
            }
        });
    }

    loadCategories(): void {
        this.productService.getCategories().subscribe({
            next: (data) => {
                this.categories = data;
            },
            error: (_error: any) => {
                console.error('Error loading categories');
            }
        });
    }

    loadStats(): void {
        this.productService.getProductStats().subscribe({
            next: (data) => {
                this.stats = data;
            },
            error: (_error: any) => {
                console.error('Error loading stats');
            }
        });
    }

    applyFilters(): void {
        this.filteredProducts = this.products.filter((product) => {
            const matchesSearch = !this.searchTerm || product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || (product.sku && product.sku.toLowerCase().includes(this.searchTerm.toLowerCase()));
            const matchesCategory = !this.selectedCategory || product.categoryId === this.selectedCategory;
            const matchesStatus = !this.selectedStatus || (this.selectedStatus === 'active' && product.isActive) || (this.selectedStatus === 'inactive' && !product.isActive);

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }

    openModal(product?: Product): void {
        if (product) {
            this.isEditMode = true;
            this.productForm = { ...product };
        } else {
            this.isEditMode = false;
            this.productForm = this.getEmptyProduct();
        }
        this.isModalOpen = true;
    }

    closeModal(): void {
        this.isModalOpen = false;
        this.productForm = this.getEmptyProduct();
    }

    saveProduct(): void {
        const product = this.productForm as Product;

        if (this.isEditMode && product.id) {
            this.productService.updateProduct(product.id, product).subscribe({
                next: () => {
                    this.loadProducts();
                    this.loadStats();
                    this.closeModal();
                },
                error: (_error: any) => {
                    console.error('Error updating product');
                }
            });
        } else {
            this.productService.createProduct(product).subscribe({
                next: () => {
                    this.loadProducts();
                    this.loadStats();
                    this.closeModal();
                },
                error: (_error: any) => {
                    console.error('Error creating product');
                }
            });
        }
    }

    deleteProduct(id: string): void {
        if (confirm('Are you sure you want to delete this product?')) {
            this.productService.deleteProduct(id).subscribe({
                next: () => {
                    this.loadProducts();
                    this.loadStats();
                },
                error: (_error: any) => {
                    console.error('Error deleting product');
                }
            });
        }
    }

    toggleProductStatus(product: Product): void {
        product.isActive = !product.isActive;
        this.productService.updateProduct(product.id, product).subscribe({
            next: () => {
                this.loadProducts();
                this.loadStats();
            },
            error: (_error: any) => {
                console.error('Error updating product status');
                product.isActive = !product.isActive;
            }
        });
    }

    toggleFeatured(product: Product): void {
        product.isFeatured = !product.isFeatured;
        this.productService.updateProduct(product.id, product).subscribe({
            next: () => {
                this.loadProducts();
            },
            error: (_error: any) => {
                console.error('Error updating featured status');
                product.isFeatured = !product.isFeatured;
            }
        });
    }

    addImage(): void {
        if (!this.productForm.images) {
            this.productForm.images = [];
        }
        this.productForm.images.push({
            id: Date.now().toString(),
            imageUrl: '',
            altText: '',
            isPrimary: this.productForm.images.length === 0,
            displayOrder: this.productForm.images.length
        });
    }

    removeImage(index: number): void {
        if (this.productForm.images) {
            this.productForm.images.splice(index, 1);
        }
    }

    onImageFileSelected(event: Event, index: number): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file || !this.productForm.images) return;

        this.uploadingImageIndex = index;
        const fileParameter: FileParameter = { data: file, fileName: file.name };
        const tenantId = this.tenantService.getTenantId() || 'host';

        this.fileUploadService.file_UploadFile('ProductImage', undefined, undefined, undefined, false, fileParameter).subscribe({
            next: (result: any) => {
                const fileId = result?.result?.id;
                if (fileId && this.productForm.images) {
                    this.productForm.images[index].imageUrl = `${environment.apiUrl}/api/FileUpload/File_DownloadFile/${fileId}?X-Tenant-ID=${tenantId}`;
                }
                this.uploadingImageIndex = null;
            },
            error: (_error: any) => {
                console.error('Error uploading product image');
                this.uploadingImageIndex = null;
            }
        });
    }

    openCategoryModal(): void {
        this.categoryForm = { name: '', description: '', isActive: true };
        this.categoryError = '';
        this.isCategoryModalOpen = true;
    }

    closeCategoryModal(): void {
        this.isCategoryModalOpen = false;
    }

    saveCategory(): void {
        if (!this.categoryForm.name?.trim()) {
            this.categoryError = 'Category name is required.';
            return;
        }
        this.categoryError = '';
        this.productService.createCategory(this.categoryForm as Category).subscribe({
            next: () => {
                this.loadCategories();
                this.closeCategoryModal();
            },
            error: (_error: any) => {
                this.categoryError = 'Error creating category. Please try again.';
            }
        });
    }

    addVariant(): void {
        if (!this.productForm.variants) {
            this.productForm.variants = [];
        }
        this.productForm.variants.push({
            id: Date.now().toString(),
            name: '',
            stockQuantity: 0,
            isActive: true
        });
    }

    removeVariant(index: number): void {
        if (this.productForm.variants) {
            this.productForm.variants.splice(index, 1);
        }
    }

    private getEmptyProduct(): Partial<Product> {
        return {
            name: '',
            description: '',
            sku: '',
            price: 0,
            categoryId: '',
            tags: [],
            images: [],
            variants: [],
            trackInventory: true,
            stockQuantity: 0,
            lowStockThreshold: 5,
            isActive: true,
            isFeatured: false
        };
    }

    getStockStatus(product: Product): string {
        if (!product.trackInventory) return 'Not Tracked';
        if (product.stockQuantity === 0) return 'Out of Stock';
        if (product.lowStockThreshold && product.stockQuantity <= product.lowStockThreshold) return 'Low Stock';
        return 'In Stock';
    }

    getStockClass(product: Product): string {
        const status = this.getStockStatus(product);
        if (status === 'Out of Stock') return 'badge-danger';
        if (status === 'Low Stock') return 'badge-warning';
        return 'badge-success';
    }
}
