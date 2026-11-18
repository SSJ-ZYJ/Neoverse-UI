import { expect, test } from 'bun:test';
import type { ButtonProps } from '@neoverse-ui/vue';
import { h } from 'vue';
import { defineSpecimen } from './lab-specimen-config';

const specimen = defineSpecimen<ButtonProps, { presses: number }>()({
  initialProps: { size: 'sm', disabled: false },
  initialState: () => ({ presses: 0 }),
  controls: {
    props: {
      size: {
        kind: 'select',
        label: { en: 'Size', zh: '尺寸' },
        options: [{ value: 'lg', label: { en: 'Large', zh: '大' } }],
      },
      disabled: { kind: 'boolean', label: { en: 'Disabled', zh: '禁用' } },
      surface: {
        kind: 'select',
        label: { en: 'Surface', zh: '表面' },
        options: [{ value: 'none', label: { en: 'None', zh: '无' } }],
      },
    },
    state: {
      presses: { kind: 'number', label: { en: 'Presses', zh: '按下次数' }, min: 0, max: 10 },
    },
  },
  render: ({ props, state, setState }) =>
    h('button', { ...props, onClick: () => setState('presses', state.presses + 1) }, state.presses),
});

test('a preview omits inherited props and restores explicit specimen values on reset', () => {
  const session = specimen.createSession();
  expect(session.render('en').props).toMatchObject({ size: 'sm', disabled: false });
  expect(session.render('en').props).not.toHaveProperty('surface');

  expect(session.edit('props', 'size', 'lg')).toBe(true);
  expect(session.edit('props', 'surface', 'none')).toBe(true);
  expect(session.render('en').props).toMatchObject({ size: 'lg', surface: 'none' });
  expect(session.fields.find(({ key }) => key === 'size')?.edited).toBe(true);
  expect(session.edit('props', 'surface', undefined)).toBe(true);
  expect(session.render('en').props).not.toHaveProperty('surface');

  session.reset();
  expect(session.render('en').props).toMatchObject({ size: 'sm', disabled: false });
  expect(session.fields.some(({ edited }) => edited)).toBe(false);
});

test('a session rejects undeclared and invalid edits without changing the preview', () => {
  const session = specimen.createSession();
  expect(session.edit('props', 'size', 'xl')).toBe(false);
  expect(session.edit('props', 'disabled', 'true')).toBe(false);
  expect(session.edit('props', 'size', undefined)).toBe(false);
  expect(session.edit('props', 'variant', 'ghost')).toBe(false);
  expect(session.edit('props', 'constructor', 'ghost')).toBe(false);
  for (const value of [-1, 11, Number.NaN, Infinity, '', '3']) {
    expect(session.edit('state', 'presses', value)).toBe(false);
  }
  expect(session.render('en').props).toMatchObject({ size: 'sm', disabled: false });
  expect(session.render('en').props).not.toHaveProperty('variant');
  expect(session.render('en').children).toBe('0');
});

test('a live preview and its Inspector share state without affecting another session', () => {
  const session = specimen.createSession();
  const other = specimen.createSession();
  const press = session.render('en').props?.onClick;
  if (typeof press !== 'function') throw new Error('Missing preview action');
  press();
  expect(session.fields.find(({ key }) => key === 'presses')?.value).toBe(1);
  expect(session.edit('state', 'presses', 7)).toBe(true);
  expect(session.render('en').children).toBe('7');
  expect(other.render('en').children).toBe('0');
  session.reset();
  expect(session.render('en').children).toBe('0');
});
