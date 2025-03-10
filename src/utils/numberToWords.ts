export function numberToWords(number: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  const convertLessThanOneThousand = (num: number): string => {
    if (num === 0) {
      return '';
    }

    let result = '';

    if (num < 20) {
      result = units[num];
    } else if (num < 100) {
      const remainder = num % 10;
      const ten = Math.floor(num / 10);
      
      if (ten === 7 || ten === 9) {
        result = tens[ten - 1] + '-' + units[10 + remainder];
      } else {
        result = tens[ten];
        if (remainder > 0) {
          if (ten === 8 && remainder === 1) {
            result += '-un';
          } else {
            result += '-' + units[remainder];
          }
        } else if (ten === 8) {
          result += 's';
        }
      }
    } else {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      
      if (hundred === 1) {
        result = 'cent';
      } else {
        result = units[hundred] + ' cent';
      }
      
      if (remainder > 0) {
        result += ' ' + convertLessThanOneThousand(remainder);
      } else if (hundred > 1) {
        result += 's';
      }
    }

    return result;
  };

  if (number === 0) {
    return 'zéro';
  }

  // Séparer la partie entière et la partie décimale
  const parts = number.toFixed(2).split('.');
  const integerPart = parseInt(parts[0]);
  const decimalPart = parseInt(parts[1]);

  let result = '';

  if (integerPart === 1) {
    result = 'un';
  } else if (integerPart === 0) {
    result = '';
  } else {
    const billions = Math.floor(integerPart / 1000000000);
    const millions = Math.floor((integerPart % 1000000000) / 1000000);
    const thousands = Math.floor((integerPart % 1000000) / 1000);
    const remainder = integerPart % 1000;

    if (billions > 0) {
      if (billions === 1) {
        result += 'un milliard ';
      } else {
        result += convertLessThanOneThousand(billions) + ' milliards ';
      }
    }

    if (millions > 0) {
      if (millions === 1) {
        result += 'un million ';
      } else {
        result += convertLessThanOneThousand(millions) + ' millions ';
      }
    }

    if (thousands > 0) {
      if (thousands === 1) {
        result += 'mille ';
      } else {
        result += convertLessThanOneThousand(thousands) + ' mille ';
      }
    }

    if (remainder > 0) {
      result += convertLessThanOneThousand(remainder);
    }
  }

  // Ajouter "euros"
  if (integerPart === 0) {
    result = 'zéro euro';
  } else if (integerPart === 1) {
    result += ' euro';
  } else {
    result += ' euros';
  }

  // Ajouter les centimes
  if (decimalPart > 0) {
    if (decimalPart === 1) {
      result += ' et un centime';
    } else {
      result += ' et ' + convertLessThanOneThousand(decimalPart) + ' centimes';
    }
  }

  return result.trim();
} 