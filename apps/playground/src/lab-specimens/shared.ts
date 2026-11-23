import { localized, tokenCopy } from '../playground-content';

/** Field names shared by every editable specimen, so the Inspector reads consistently. */
export const variantLabel = localized('Variant', '变体');
export const sizeLabel = localized('Size', '尺寸');
export const shapeLabel = localized('Shape', '形状');
export const surfaceLabel = localized('Surface', '表面');
export const stateLabel = localized('State', '状态');

export const disabled = { kind: 'boolean', label: localized('Disabled', '禁用') } as const;
export const loading = { kind: 'boolean', label: localized('Loading', '加载中') } as const;

export const buttonVariantOptions = [
  { value: 'primary', label: localized('Primary', '主要') },
  { value: 'secondary', label: localized('Secondary', '次要') },
  { value: 'ghost', label: localized('Ghost', '无填充') },
] as const;

export const sizeOptions = [
  { value: 'sm', label: localized('Small', '小') },
  { value: 'md', label: localized('Medium', '中') },
  { value: 'lg', label: localized('Large', '大') },
] as const;

export const statusVariantOptions = [
  { value: 'neutral', label: localized('Neutral', '中性') },
  { value: 'info', label: localized('Info', '信息') },
  { value: 'success', label: localized('Success', '成功') },
  { value: 'warning', label: localized('Warning', '警告') },
  { value: 'danger', label: localized('Danger', '危险') },
] as const;

export const validationOptions = [
  { value: 'none', label: localized('None', '无') },
  { value: 'error', label: localized('Error', '错误') },
  { value: 'warning', label: localized('Warning', '警告') },
  { value: 'success', label: localized('Success', '成功') },
] as const;

export const glassOptions = [
  { value: 'none', label: localized('None', '无') },
  { value: 'glass-subtle', label: tokenCopy.glassVariants.subtle },
  { value: 'glass-elevated', label: tokenCopy.glassVariants.elevated },
  { value: 'glass-immersive', label: tokenCopy.glassVariants.immersive },
] as const;

/** Every public surface preset, in the order the material standards introduce them. */
export const surfaceOptions = [
  { value: 'none', label: localized('None', '无') },
  { value: 'solid', label: localized('Solid', '不透明') },
  { value: 'subtle', label: localized('Subtle', '轻微') },
  { value: 'elevated', label: localized('Elevated', '抬升') },
  { value: 'inset', label: localized('Inset', '内嵌') },
  { value: 'glass-subtle', label: tokenCopy.glassVariants.subtle },
  { value: 'glass-elevated', label: tokenCopy.glassVariants.elevated },
  { value: 'glass-immersive', label: tokenCopy.glassVariants.immersive },
] as const;
