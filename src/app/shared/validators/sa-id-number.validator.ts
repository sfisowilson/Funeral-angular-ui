import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SAIdValidator } from '../utils/sa-id-validator';

/**
 * Angular validator for South African ID numbers.
 * - Empty values are treated as valid (use Validators.required separately).
 */
export function saIdNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const raw = control.value;
        if (raw === null || raw === undefined || raw === '') {
            return null;
        }

        const value = String(raw).trim();
        if (!value) {
            return null;
        }

        const info = SAIdValidator.validate(value);
        if (info.isValid) {
            return null;
        }

        return {
            saIdNumber: info.errorMessage || true
        };
    };
}
