import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Observable, debounceTime, distinctUntilChanged, map, startWith } from "rxjs";
import { UsuarioService } from "../../service/usuario.service";
import { HttpClient, HttpClientModule } from "@angular/common/http";


@Component({
  selector: 'app-form-test',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,HttpClientModule],
  templateUrl: './form-test.component.html',
  styleUrl: './form-test.component.css',
  providers: [UsuarioService],

})
export class FormTestComponent implements OnInit {
  adminForm: FormGroup = new FormGroup({});
  citySearch = new FormControl("");
  cities: string[] = [];
  sexes: string[] = [];
  ages: number[] = [];
  filteredCities$: Observable<string[]> = new Observable<string[]>();
  isSubmitting = false;
  submitSuccess = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  private initForm() {
    this.adminForm = this.fb.group({
      sex: ["", Validators.required],
      cities: [[], [Validators.required, this.minArrayLength(1)]],
      ages: [[], [Validators.required, this.minArrayLength(1)]],
      message: ["", [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  // Custom validator to ensure at least one item is selected
  private minArrayLength(min: number) {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (control.value && control.value.length >= min) {
        return null;
      }
      return { 'minArrayLength': { value: control.value, requiredLength: min } };
    };
  }

  private loadData() {
    this.usuarioService.obtenerTodasCiudades().subscribe({
      next: (cities) => {
        this.cities = cities || [];
        this.setupCitySearch();
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        this.cities = [];
      }
    });

    this.usuarioService.obtenerTodosSexos().subscribe({
      next: (sexes) => {
        this.sexes = sexes || [];
      },
      error: (error) => {
        console.error('Error loading sexes:', error);
        this.sexes = [];
      }
    });

    this.usuarioService.obtenerEstadisticasEdad().subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.ages = response.sort((a, b) => a - b);
        } else if (typeof response === 'object' && response !== null) {
          this.ages = Object.values(response).sort((a, b) => a - b);
        } else {
          this.ages = [];
        }
      },
      error: (error) => {
        console.error('Error loading ages:', error);
        this.ages = [];
      }
    });
  }

  private setupCitySearch() {
    this.filteredCities$ = this.citySearch.valueChanges.pipe(
      startWith(""),
      debounceTime(300),
      distinctUntilChanged(),
      map(searchTerm => {
        if (!searchTerm || searchTerm.trim() === "") {
          return this.cities;
        }
        const normalizedSearchTerm = searchTerm.toLowerCase().trim();
        return this.cities.filter(city =>
          city.toLowerCase().includes(normalizedSearchTerm)
        );
      })
    );
  }

  onCitySelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (!select) return;

    const selectedOptions = Array.from(select.selectedOptions).map(opt => opt.value);
    const currentCities = this.adminForm.get('cities')?.value || [];

    // Merge with existing selections, avoiding duplicates
    const updatedCities = [...new Set([...currentCities, ...selectedOptions])];

    this.adminForm.get('cities')?.setValue(updatedCities);
    this.adminForm.get('cities')?.markAsTouched();

    // Clear search when selection is made
    this.citySearch.setValue('');
  }

  onAgeSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (!select) return;

    const selectedOptions = Array.from(select.selectedOptions).map(opt => Number(opt.value));
    const currentAges = this.adminForm.get('ages')?.value || [];

    // Merge with existing selections, avoiding duplicates
    const updatedAges = [...new Set([...currentAges, ...selectedOptions])];

    this.adminForm.get('ages')?.setValue(updatedAges);
    this.adminForm.get('ages')?.markAsTouched();
  }

  removeCity(city: string) {
    const currentCities = this.adminForm.get('cities')?.value as string[] || [];
    const updatedCities = currentCities.filter(c => c !== city);
    this.adminForm.get('cities')?.setValue(updatedCities);
    this.adminForm.get('cities')?.markAsTouched();
  }

  removeAge(age: number) {
    const currentAges = this.adminForm.get('ages')?.value as number[] || [];
    const updatedAges = currentAges.filter(a => a !== age);
    this.adminForm.get('ages')?.setValue(updatedAges);
    this.adminForm.get('ages')?.markAsTouched();
  }

  // Helper method to check if a city is already selected
  isCitySelected(city: string): boolean {
    const selectedCities = this.adminForm.get('cities')?.value || [];
    return selectedCities.includes(city);
  }

  // Helper method to check if an age is already selected
  isAgeSelected(age: number): boolean {
    const selectedAges = this.adminForm.get('ages')?.value || [];
    return selectedAges.includes(age);
  }

  // Method to clear all cities
  clearAllCities() {
    this.adminForm.get('cities')?.setValue([]);
    this.adminForm.get('cities')?.markAsTouched();
  }

  // Method to clear all ages
  clearAllAges() {
    this.adminForm.get('ages')?.setValue([]);
    this.adminForm.get('ages')?.markAsTouched();
  }

  // Method to add city by clicking (alternative to select)
  addCity(city: string) {
    if (this.isCitySelected(city)) return;

    const currentCities = this.adminForm.get('cities')?.value || [];
    const updatedCities = [...currentCities, city];
    this.adminForm.get('cities')?.setValue(updatedCities);
    this.adminForm.get('cities')?.markAsTouched();
  }

  // Method to add age by clicking (alternative to select)
  addAge(age: number) {
    if (this.isAgeSelected(age)) return;

    const currentAges = this.adminForm.get('ages')?.value || [];
    const updatedAges = [...currentAges, age];
    this.adminForm.get('ages')?.setValue(updatedAges);
    this.adminForm.get('ages')?.markAsTouched();
  }

  onSubmit() {
    if (this.adminForm.valid) {
      this.isSubmitting = true;

      const formData = {
        sex: this.adminForm.value.sex,
        cities: this.adminForm.value.cities || [],
        ages: this.adminForm.value.ages || [],
        message: this.adminForm.value.message
      };

      console.log("Formulario enviado:", formData);

      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.submitSuccess = true;

        // Reset form
        this.adminForm.reset({
          sex: "",
          cities: [],
          ages: [],
          message: ""
        });

        // Clear search
        this.citySearch.reset();

        // Hide success message after 3 seconds
        setTimeout(() => {
          this.submitSuccess = false;
        }, 3000);
      }, 1500);
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.adminForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  // Getter methods for easier template access
  get selectedCities(): string[] {
    return this.adminForm.get('cities')?.value || [];
  }

  get selectedAges(): number[] {
    return this.adminForm.get('ages')?.value || [];
  }

  get selectedCitiesCount(): number {
    return this.selectedCities.length;
  }

  get selectedAgesCount(): number {
    return this.selectedAges.length;
  }
}
