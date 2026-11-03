import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { MyServiceService } from '../../Common-Service/my-service.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-add-brand',
  imports: [CommonModule, ReactiveFormsModule,RouterLink],
  templateUrl: './add-brand.component.html',
  styleUrl: './add-brand.component.css'
})
export class AddBrandComponent {

  brandForm!: FormGroup;
  selectedFile: File | null = null;
  logoError = false;
  imagePreview: string | null = null;

  constructor(private fb: FormBuilder, private myService: MyServiceService) {
    this.brandForm = this.fb.group({
      brandName: ['', Validators.required]
    });
  }

  get brandName() {
    return this.brandForm.get('brandName');
  }

onFileSelect(event: any): void {

    const file = event.target.files?.[0];

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

    if (!this.selectedFile) {
      this.logoError = true;
      return;
    }

    if (this.brandForm.invalid) {
      this.brandForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();

    formData.append(
      'BrandName',
      this.brandForm.value.brandName
    );

    formData.append(
      'BrandLogo',
      this.selectedFile
    );

    this.myService.addBrand(formData).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: 'Brand Added!',
          text: res.message || 'Your brand has been added successfully.',
          confirmButtonColor: '#16181d'
        });
        
        this.brandForm.reset();
        this.selectedFile = null;
        this.imagePreview = null;
        this.logoError = false;
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Brand Failed',
          text: err?.error?.message || 'Something went wrong. Please try again.',
          confirmButtonColor: '#16181d'
        });
      }
    });
  }
}
