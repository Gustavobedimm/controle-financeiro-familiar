import { z } from "zod";

export const moneySchema = z.coerce.number().min(0.01, "Informe um valor maior que zero.");
export const requiredText = z.string().min(2, "Informe pelo menos 2 caracteres.");
export const dayOfMonthSchema = z.coerce.number().int().min(1).max(31);
