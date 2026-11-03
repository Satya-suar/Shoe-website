import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MyServiceService } from '../../Common-Service/my-service.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-product',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent {

  productForm!: FormGroup;
  imagePreview: string | null = null;
selectedFile: File | null = null;
brands: any[] = [];

  constructor(private myService: MyServiceService,private fb: FormBuilder) {
    this.productForm = this.fb.group({

  brandId: ['', Validators.required],

  productName: [
    '',
    [
      Validators.required,
      Validators.minLength(3)
    ]
  ],

  size: [
    '',
    [
      Validators.required,
      Validators.min(1)
    ]
  ],

  color: ['', Validators.required],

  price: [
    '',
    [
      Validators.required,
      Validators.min(100)
    ]
  ],
  productDescription: ['', Validators.required],

  isStock: [true],
  isPopular: [false],
  isActive: [true]

});

   }

   ngOnInit(): void {
  this.getBrands();
}

getBrands(): void {
  this.myService.getBrands().subscribe({
    next: (res) => {
      this.brands = res.data || [];
    },
    error: (err) => {
      console.error(err);
    }
  });
}


onFileSelected(event: any): void {

  const file = event.target.files[0];

  if (!file) {
    return;
  }

  this.selectedFile = file;

  const reader = new FileReader();

  reader.onload = () => {
    this.imagePreview = reader.result as string;
  };

  reader.readAsDataURL(file);

}
 onSubmit() {

  if (this.productForm.invalid) {

    this.productForm.markAllAsTouched();

    return;
  }

  const formData = new FormData();

  formData.append(
    'BrandId',
    this.productForm.value.brandId
  );

  formData.append(
    'ProductName',
    this.productForm.value.productName
  );

  formData.append(
    'Size',
    this.productForm.value.size
  );

  formData.append(
    'Color',
    this.productForm.value.color
  );

  formData.append(
    'Price',
    this.productForm.value.price
  );

  formData.append(
    'ProductDescription',
    this.productForm.value.productDescription
  );

  formData.append(
    'IsStock',
    this.productForm.value.isStock
  );

  formData.append(
    'IsPopular',
    this.productForm.value.isPopular
  );

  formData.append(
    'IsActive',
    this.productForm.value.isActive
  );

  formData.append(
    'ProductImage',
    this.selectedFile!
  );

  this.myService.addProduct(formData).subscribe({
    next: (res) => {
      Swal.fire({
        icon: 'success',
        title: 'Product Added!',
        text: res.message || 'Your product has been added successfully.',
        confirmButtonColor: '#16181d'
      });
     this.productForm.reset({
  isStock: true,
  isPopular: false,
  isActive: true
});

this.selectedFile = null;
this.imagePreview = null;
    },
    error: (err) => {
      Swal.fire({
        icon: 'error',
        title: 'Product Failed',
        text: err?.error?.message || 'Something went wrong. Please try again.',
        confirmButtonColor: '#16181d'
      });
    }
  });
}
}
