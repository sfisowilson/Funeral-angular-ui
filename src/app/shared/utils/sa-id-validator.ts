/**
 * South African ID Number Validator and Parser
 * Format: YYMMDDGSSSCAZ
 * - YYMMDD: Date of Birth
 * - G: Gender indicator (0-4999 female, 5000-9999 male)
 * - SSSS: Sequence number
 * - C: Citizenship (0 = SA Citizen, 1 = Permanent Resident)
 * - A: Usually 8 or 9
 * - Z: Checksum digit
 */

export interface SAIdInfo {
  isValid: boolean;
  dateOfBirth: Date | null;
  gender: 'Male' | 'Female' | null;
  citizenship: 'SA Citizen' | 'Permanent Resident' | null;
  age: number | null;
  errorMessage?: string;
}

export class SAIdValidator {
  // Set to false to enable proper SA ID checksum validation
  private static SKIP_CHECKSUM_VALIDATION = false;

  /**
   * Validates and parses a South African ID number
   */
  static validate(idNumber: string): SAIdInfo {
    // Remove spaces and check if it's 13 digits
    const cleanId = idNumber.replace(/\s/g, '');
    
    if (!/^\d{13}$/.test(cleanId)) {
      return {
        isValid: false,
        dateOfBirth: null,
        gender: null,
        citizenship: null,
        age: null,
        errorMessage: 'ID number must be exactly 13 digits'
      };
    }

    // Extract components
    const year = parseInt(cleanId.substring(0, 2), 10);
    const month = parseInt(cleanId.substring(2, 4), 10);
    const day = parseInt(cleanId.substring(4, 6), 10);
    const genderDigit = parseInt(cleanId.substring(6, 10), 10);
    const citizenshipDigit = parseInt(cleanId.substring(10, 11), 10);
    const checksum = parseInt(cleanId.substring(12, 13), 10);

    // Determine full year (assume current century if year is less than current year, otherwise previous century)
    const currentYear = new Date().getFullYear() % 100;
    const fullYear = year <= currentYear ? 2000 + year : 1900 + year;

    // Validate date
    const dateOfBirth = new Date(fullYear, month - 1, day);
    if (
      dateOfBirth.getFullYear() !== fullYear ||
      dateOfBirth.getMonth() !== month - 1 ||
      dateOfBirth.getDate() !== day
    ) {
      return {
        isValid: false,
        dateOfBirth: null,
        gender: null,
        citizenship: null,
        age: null,
        errorMessage: 'Invalid date in ID number'
      };
    }

    // Validate future date
    if (dateOfBirth > new Date()) {
      return {
        isValid: false,
        dateOfBirth: null,
        gender: null,
        citizenship: null,
        age: null,
        errorMessage: 'Date of birth cannot be in the future'
      };
    }

    // Validate checksum using Luhn algorithm (skip if flag is set)
    if (!this.SKIP_CHECKSUM_VALIDATION && !this.validateChecksum(cleanId)) {
      return {
        isValid: false,
        dateOfBirth: null,
        gender: null,
        citizenship: null,
        age: null,
        errorMessage: 'Invalid ID number checksum'
      };
    }

    // Determine gender
    const gender = genderDigit < 5000 ? 'Female' : 'Male';

    // Determine citizenship
    const citizenship = citizenshipDigit === 0 ? 'SA Citizen' : 'Permanent Resident';

    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return {
      isValid: true,
      dateOfBirth,
      gender,
      citizenship,
      age
    };
  }

  /**
   * Validates the checksum digit using SA ID Luhn algorithm
   * SA ID uses a variant where even positions (2nd, 4th, 6th, etc.) are doubled
   * when counting positions from left to right starting at 1
   */
  private static validateChecksum(idNumber: string): boolean {
    let sum = 0;

    console.log('🔍 SA ID Checksum Validation:', idNumber);
    
    // Process from left to right, excluding the checksum digit (positions 0-11)
    // In 0-based indexing: double odd positions (1, 3, 5, 7, 9, 11)
    // This corresponds to even positions in 1-based indexing (2, 4, 6, 8, 10, 12)
    for (let i = 0; i < 12; i++) {
      let digit = parseInt(idNumber.charAt(i), 10);
      const originalDigit = digit;

      // Double digits at odd positions in 0-based indexing (positions 1, 3, 5, 7, 9, 11)
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9; // Subtract 9 if result is greater than 9
        }
        console.log(`  Index ${i} (Pos ${i+1}): ${originalDigit} x2 = ${originalDigit*2} -> ${digit}`);
      } else {
        console.log(`  Index ${i} (Pos ${i+1}): ${originalDigit} (keep)`);
      }

      sum += digit;
    }

    const calculatedChecksum = (10 - (sum % 10)) % 10;
    const providedChecksum = parseInt(idNumber.charAt(12), 10);

    console.log(`  Sum: ${sum}`);
    console.log(`  Calculated checksum: ${calculatedChecksum}`);
    console.log(`  Provided checksum: ${providedChecksum}`);
    console.log(`  ✓ Valid: ${calculatedChecksum === providedChecksum}`);

    return calculatedChecksum === providedChecksum;
  }

  /**
   * Formats an ID number with spaces for readability
   */
  static format(idNumber: string): string {
    const cleanId = idNumber.replace(/\s/g, '');
    if (cleanId.length !== 13) return idNumber;
    
    // Format as: YYMMDD GSSS CAZ
    return `${cleanId.substring(0, 6)} ${cleanId.substring(6, 10)} ${cleanId.substring(10)}`;
  }
}
