import { test, expect } from './fixtures.js';

// Criterios 36, 37, 38 y 41 sobre el formulario de contacto de Home (`/#contacto`).

const FORM = 'section#contacto form';
const CONTROLS = `${FORM} input, ${FORM} textarea`;
const SUBMIT = `${FORM} button[type="submit"]`;
// Errores de campo pintados (con o sin role) y resumen oculto que anuncia el total al enviar con errores.
const FIELD_ERRORS = `${FORM} [id$="-error"]`;
const SUMMARY = `${FORM} [role="status"]`;

const openForm = async (page) => {
  await page.goto('/#contacto');
  await expect(page.locator(FORM)).toBeVisible();
};

test('al ir a /#contacto el foco queda en el encabezado de la sección', async ({ page }) => {
  await openForm(page);
  await expect(page.locator('section#contacto h2')).toBeFocused();
});

test.describe('validación propia (criterio 36)', () => {
  test('lleva noValidate y el error del correo es un nodo del DOM con aria-invalid', async ({ page }) => {
    await openForm(page);
    expect(await page.locator(FORM).evaluate((form) => form.noValidate)).toBe(true);

    const email = page.locator(`${FORM} input[type="email"]`);
    await expect(email).not.toHaveAttribute('aria-invalid', /.*/);
    await email.fill('juan.perez');
    await page.locator(`${FORM} input[autocomplete="name"]`).focus(); // blur del correo

    await expect(email).toHaveAttribute('aria-invalid', 'true');
    const describedBy = (await email.getAttribute('aria-describedby')).split(' ');
    expect(describedBy, 'el hint y el error van en aria-describedby').toHaveLength(2);
    const error = page.locator(`[id="${describedBy.find((id) => id.endsWith("-error"))}"]`);
    await expect(error).toHaveAttribute('role', 'alert');
    await expect(error).toBeVisible();

    // El mensaje es el de la aplicación (español), no el del navegador (validationMessage, inglés).
    const native = await email.evaluate((input) => input.validationMessage);
    const text = (await error.innerText()).trim();
    expect(text).not.toBe('');
    expect(text).not.toContain(native);
    expect(text).toMatch(/correo/i);
  });

  test('un campo sin tocar no muestra error y el error desaparece al corregirlo', async ({ page }) => {
    await openForm(page);
    await expect(page.locator(`${FORM} [role="alert"]`)).toHaveCount(0);
    const email = page.locator(`${FORM} input[type="email"]`);
    await email.fill('mal');
    await email.blur();
    await expect(page.locator(`${FORM} [role="alert"]`)).toHaveCount(1);
    await email.fill('nombre@dominio.es');
    await expect(page.locator(`${FORM} [role="alert"]`)).toHaveCount(0);
    await expect(email).not.toHaveAttribute('aria-invalid', /.*/);
  });

  test('Enter con errores muestra los cuatro sin role, un resumen status y el foco al primero, sin enviar', async ({ page, mock }) => {
    await openForm(page);
    const subject = page.locator(`${FORM} input[maxlength="150"]`);
    await subject.click();
    await subject.press('Enter');

    await expect(page.locator(FIELD_ERRORS)).toHaveCount(4);
    await expect(page.locator(`${FORM} [role="alert"]`)).toHaveCount(0);
    await expect(page.locator(SUMMARY)).toHaveText(/4 errores/);
    await expect(page.locator(`${FORM} input[autocomplete="name"]`)).toBeFocused();
    expect(mock.calls.filter((call) => call.name === 'send-email')).toEqual([]);
  });

  test('un clic en «Enviar» deshabilitado (aria-disabled) tampoco envía y enseña los errores', async ({ page, mock }) => {
    await openForm(page);
    const submit = page.locator(SUBMIT);
    await expect(submit).toHaveAttribute('aria-disabled', 'true');
    // Playwright da por «no habilitado» un botón con aria-disabled: `force` hace el clic igualmente, como un usuario.
    await submit.click({ force: true });
    await expect(page.locator(FIELD_ERRORS)).toHaveCount(4);
    await expect(page.locator(`${FORM} [role="alert"]`)).toHaveCount(0);
    expect(mock.calls.filter((call) => call.name === 'send-email')).toEqual([]);
  });

  test('con datos válidos «Enviar» se habilita y envía el formulario', async ({ page, mock }) => {
    await openForm(page);
    await page.locator(`${FORM} input[autocomplete="name"]`).fill('María López');
    await page.locator(`${FORM} input[type="email"]`).fill('maria@dominio.es');
    await page.locator(`${FORM} input[maxlength="150"]`).fill('Consulta de prueba');
    await page.locator(`${FORM} textarea`).fill('Mensaje de prueba con más de veinte caracteres.');
    const submit = page.locator(SUBMIT);
    await expect(submit).not.toHaveAttribute('aria-disabled', /.*/);
    await submit.click();
    await expect.poll(() => mock.calls.filter((call) => call.name === 'send-email').length).toBe(1);
    const body = JSON.parse(mock.calls.find((call) => call.name === 'send-email').body);
    expect(body).toEqual({
      username: 'María López',
      email: 'maria@dominio.es',
      subject: 'Consulta de prueba',
      message: 'Mensaje de prueba con más de veinte caracteres.',
    });
  });

  test('tras un envío válido los campos quedan vacíos, sin errores, y el foco va al encabezado de #contacto', async ({ page, mock }) => {
    await openForm(page);
    await page.locator(`${FORM} input[autocomplete="name"]`).fill('María López');
    await page.locator(`${FORM} input[type="email"]`).fill('maria@dominio.es');
    await page.locator(`${FORM} input[maxlength="150"]`).fill('Consulta de prueba');
    await page.locator(`${FORM} textarea`).fill('Mensaje de prueba con más de veinte caracteres.');
    // El foco está en el formulario: el que haya al terminar lo pone el envío, no el punto de partida.
    await page.locator(SUBMIT).focus();

    await page.locator(SUBMIT).click();

    await expect.poll(() => mock.calls.filter((call) => call.name === 'send-email').length).toBe(1);
    await expect(page.locator(CONTROLS)).toHaveCount(4);
    for (const control of await page.locator(CONTROLS).all()) await expect(control).toHaveValue('');
    await expect(page.locator(`${FORM} [aria-invalid]`)).toHaveCount(0);
    await expect(page.locator(`${FORM} [role="alert"]`)).toHaveCount(0);
    await expect(page.locator(SUMMARY)).toHaveText('');
    await expect(page.locator('section#contacto h2')).toBeFocused();
    expect(await page.evaluate(() => document.activeElement.tagName)).toBe('H2');
  });
});

for (const lang of ['es', 'en']) {
  test.describe(`placeholders y etiquetas en ${lang} (criterio 37)`, () => {
    test.use({ lang });

    test('cada control tiene su <label> y ningún placeholder es igual a su etiqueta', async ({ page }) => {
      await openForm(page);
      const pairs = await page.locator(CONTROLS).evaluateAll((controls) =>
        controls.map((control) => ({
          label: document.querySelector(`label[for="${control.id}"]`)?.textContent.trim() ?? null,
          placeholder: control.getAttribute('placeholder'),
        }))
      );
      expect(pairs).toHaveLength(4);
      for (const { label, placeholder } of pairs) {
        expect(label, 'etiqueta visible').toBeTruthy();
        expect(placeholder, `placeholder de «${label}»`).toBeTruthy();
        expect(placeholder.trim().toLowerCase()).not.toBe(label.toLowerCase());
      }
    });
  });
}

// Criterio 41: input, textarea y button heredan la misma familia y el mismo tamaño, a 390, 768 y 1440.
for (const width of [390, 768, 1440]) {
  test(`mismos fontFamily y fontSize en input, textarea y botón a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openForm(page);
    const fonts = await page.locator(`${CONTROLS}, ${SUBMIT}`).evaluateAll((controls) =>
      controls.map((control) => {
        const style = getComputedStyle(control);
        return { tag: control.tagName.toLowerCase(), family: style.fontFamily, size: style.fontSize };
      })
    );
    expect(fonts.map((font) => font.tag).sort()).toEqual(['button', 'input', 'input', 'input', 'textarea']);
    expect(new Set(fonts.map((font) => font.family)).size, JSON.stringify(fonts)).toBe(1);
    expect(new Set(fonts.map((font) => font.size)).size, JSON.stringify(fonts)).toBe(1);
  });
}

// Criterio 47: el cuadro de error no desplaza ni solapa al campo siguiente y no hay scroll horizontal.
for (const width of [390, 768, 1024, 1440]) {
  test(`con errores e hints visibles no hay desbordamiento ni solape a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openForm(page);
    await page.locator(SUBMIT).click({ force: true });
    await expect(page.locator(FIELD_ERRORS)).toHaveCount(4);
    const result = await page.evaluate((selector) => {
      const form = document.querySelector(selector);
      const blocks = [...form.querySelectorAll('input, textarea, label, [id$="-error"], button[type="submit"]')];
      const overlaps = [];
      for (let i = 0; i < blocks.length; i += 1) {
        for (let j = i + 1; j < blocks.length; j += 1) {
          const a = blocks[i].getBoundingClientRect();
          const b = blocks[j].getBoundingClientRect();
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (w > 1 && h > 1) overlaps.push(`${blocks[i].tagName} con ${blocks[j].tagName}`);
        }
      }
      return { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, overlaps };
    }, FORM);
    expect(result.scrollWidth).toBeLessThanOrEqual(result.innerWidth);
    expect(result.overlaps).toEqual([]);
  });
}
