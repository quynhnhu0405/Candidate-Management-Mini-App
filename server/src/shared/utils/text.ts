// Helpers for accent-insensitive search (so "quy" finds "Quý" and "Nguyễn Văn Quý").
//
// The database side uses Postgres' built-in translate() instead of the "unaccent" extension, because an
// extension has to be installed on every database/machine (and can be blocked, e.g. by Windows security policy).

const VIETNAMESE_LOWER = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";

// Remove accents from user input. NFD splits "ý" into "y" + a combining mark, which the regex deletes.
// "đ" has no combining mark, so it is replaced by hand.
export const removeAccents = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

// Arguments for translate(column, from, to): every accented letter (lower + upper case) -> its plain letter.
// Case is then ignored by ILIKE, so we do not depend on the database locale to lower-case "Ý" or "Đ".
export const ACCENT_FROM = VIETNAMESE_LOWER + VIETNAMESE_LOWER.toUpperCase();
export const ACCENT_TO = [...ACCENT_FROM].map((char) => removeAccents(char).toLowerCase()).join("");
