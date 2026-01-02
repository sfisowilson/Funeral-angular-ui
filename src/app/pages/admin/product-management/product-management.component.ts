import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, ProductStats, Category } from '../../../core/services/product.service';

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
    
    constructor(private productService: ProductService) {}
    
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
        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = !this.searchTerm || 
                product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (product.sku && product.sku.toLowerCase().includes(this.searchTerm.toLowerCase()));
            const matchesCategory = !this.selectedCategory || product.category === this.selectedCategory;
            const matchesStatus = !this.selectedStatus || 
                (this.selectedStatus === 'active' && product.isActive) ||
                (this.selectedStatus === 'inactive' && !product.isActive);
            
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
            category: '',
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
