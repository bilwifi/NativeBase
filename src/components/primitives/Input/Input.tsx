import React, { memo, forwardRef } from 'react';
import type { IInputProps } from './types';
import { TextInput, StyleSheet, View } from 'react-native';
import {
  useTheme,
  useBreakpointValue,
  usePropsResolution,
  useToken,
} from '../../../hooks';
import { useColorMode } from '../../../core/color-mode';

// Helper pour convertir les valeurs éventuellement en string vers number si possible
const normalize = (val: any) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val.endsWith('px')) {
    const n = Number(val.slice(0, -2));
    return Number.isFinite(n) ? n : val;
  }
  const n = Number(val);
  return Number.isFinite(n) ? n : val;
};

const resolveScaleValue = (
  value: any,
  scale?: Record<string, any>
) => {
  if (value == null) return undefined;
  if (
    typeof value === 'string' &&
    scale &&
    Object.prototype.hasOwnProperty.call(scale, value)
  ) {
    return scale[value];
  }
  return value;
};

const resolveNumericValue = (
  value: any,
  scale?: Record<string, any>
) => {
  return normalize(resolveScaleValue(value, scale));
};

// Input basé sur TextInput RN, mais conserve les éléments gauche/droite et le theming clair/sombre.
const Input = (
  {
  InputLeftElement,
  InputRightElement,
  leftElement,
  rightElement,
  isDisabled,
  isReadOnly,
  isInvalid,
  style,
  placeholderTextColor,
  selectionColor,
  multiline,
  width,
  w,
  h,
  borderRadius,
  borderWidth,
  borderColor,
  px,
  py,
  fontSize,
  fontFamily,
  fontWeight,
  fontStyle,
  color,
  ...rest
}: IInputProps,
  ref: any
) => {
  const theme = useTheme?.() || {};
  const { colorMode } = useColorMode?.() || { colorMode: 'light' };
  const colors = theme.colors || {};
  const resolvedProps = usePropsResolution(
    'Input',
    {
      InputLeftElement,
      InputRightElement,
      leftElement,
      rightElement,
      isDisabled,
      isReadOnly,
      isInvalid,
      style,
      placeholderTextColor,
      selectionColor,
      multiline,
      width,
      w,
      h,
      borderRadius,
      borderWidth,
      borderColor,
      px,
      py,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      color,
      ...rest,
    },
    {
      isDisabled,
      isReadOnly,
      isInvalid,
    }
  );

  const colorConfig =
    colorMode === 'dark'
      ? {
          backgroundColor: colors.dark?.['100'] || '#111',
          borderColor: colors.muted?.['700'] || '#555',
          text: colors.text?.['50'] || '#f5f5f5',
          placeholder: colors.text?.['600'] || '#9ca3af',
        }
      : {
          backgroundColor: colors.light?.['50'] || '#fff',
          borderColor: colors.muted?.['300'] || '#d1d5db',
          text: colors.text?.['900'] || '#111827',
          placeholder: colors.text?.['400'] || '#9ca3af',
        };

  const widthValue = resolveNumericValue(
    useBreakpointValue(resolvedProps.width ?? resolvedProps.w ?? width ?? w),
    theme.sizes
  );
  const heightValue = resolveNumericValue(
    useBreakpointValue(resolvedProps.height ?? resolvedProps.h ?? h),
    theme.sizes
  );
  const borderRadiusValue = resolveNumericValue(
    useBreakpointValue(resolvedProps.borderRadius ?? borderRadius),
    theme.radii
  );
  const borderWidthValue = resolveNumericValue(
    useBreakpointValue(resolvedProps.borderWidth ?? borderWidth),
    theme.borderWidths
  );
  const paddingHorizontalValue = resolveNumericValue(
    useBreakpointValue(resolvedProps.paddingHorizontal),
    theme.space
  );
  const paddingVerticalValue = resolveNumericValue(
    useBreakpointValue(resolvedProps.paddingVertical),
    theme.space
  );
  const paddingLeftValue = resolveNumericValue(
    useBreakpointValue(
      resolvedProps.paddingLeft ?? resolvedProps.pl ?? px
    ) ?? paddingHorizontalValue,
    theme.space
  );
  const paddingRightValue = resolveNumericValue(
    useBreakpointValue(
      resolvedProps.paddingRight ?? resolvedProps.pr ?? px
    ) ?? paddingHorizontalValue,
    theme.space
  );
  const paddingTopValue = resolveNumericValue(
    useBreakpointValue(
      resolvedProps.paddingTop ?? resolvedProps.pt ?? py
    ) ?? paddingVerticalValue,
    theme.space
  );
  const paddingBottomValue = resolveNumericValue(
    useBreakpointValue(
      resolvedProps.paddingBottom ?? resolvedProps.pb ?? py
    ) ?? paddingVerticalValue,
    theme.space
  );
  const fontSizeValue = resolveNumericValue(
    useBreakpointValue(resolvedProps.fontSize ?? fontSize),
    theme.fontSizes
  );
  const textColorToken = resolvedProps.color ?? color ?? colorConfig.text;
  const placeholderColorToken =
    resolvedProps.placeholderTextColor ??
    placeholderTextColor ??
    colorConfig.placeholder;
  const backgroundColorToken =
    typeof resolvedProps.bgColor === 'string'
      ? resolvedProps.bgColor
      : typeof resolvedProps.backgroundColor === 'string'
      ? resolvedProps.backgroundColor
      : typeof resolvedProps.bg === 'string'
      ? resolvedProps.bg
      : typeof resolvedProps.background === 'string'
      ? resolvedProps.background
      : colorConfig.backgroundColor;
  const borderColorToken =
    resolvedProps.borderColor ?? borderColor ?? colorConfig.borderColor;
  const selectionColorToken =
    resolvedProps.selectionColor ?? selectionColor ?? textColorToken;

  const textColor = useToken('colors', textColorToken, textColorToken);
  const placeholderColor = useToken(
    'colors',
    placeholderColorToken,
    placeholderColorToken
  );
  const backgroundColor = useToken(
    'colors',
    backgroundColorToken,
    backgroundColorToken
  );
  const resolvedBorderColor = useToken(
    'colors',
    borderColorToken,
    borderColorToken
  );
  const resolvedSelectionColor = useToken(
    'colors',
    selectionColorToken,
    selectionColorToken
  );
  const effectivePaddingLeft =
    paddingLeftValue != null ? paddingLeftValue : defaultPaddingHorizontal;
  const effectivePaddingRight =
    paddingRightValue != null ? paddingRightValue : defaultPaddingHorizontal;
  const effectivePaddingTop =
    paddingTopValue != null ? paddingTopValue : defaultPaddingVertical;
  const effectivePaddingBottom =
    paddingBottomValue != null ? paddingBottomValue : defaultPaddingVertical;

  const computedHeight =
    heightValue != null
      ? heightValue
      : typeof fontSizeValue === 'number'
      ? fontSizeValue +
        effectivePaddingTop +
        effectivePaddingBottom +
        (typeof borderWidthValue === 'number' ? borderWidthValue * 2 : 0)
      : undefined;

  const containerStyle = StyleSheet.flatten([
    defaultContainer,
    {
      backgroundColor,
      borderColor: resolvedBorderColor,
      width: widthValue != null ? widthValue : undefined,
      height: computedHeight,
      borderRadius:
        borderRadiusValue != null
          ? borderRadiusValue
          : defaultContainer.borderRadius,
      borderWidth:
        borderWidthValue != null
          ? borderWidthValue
          : defaultContainer.borderWidth,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },
    style,
  ]);

  const textStyle = StyleSheet.flatten([
    styles.textInput,
    {
      color: textColor,
      fontSize: fontSizeValue != null ? fontSizeValue : 16,
      fontFamily: fontFamily || undefined,
      fontWeight: fontWeight || undefined,
      fontStyle: fontStyle || undefined,
      paddingLeft: effectivePaddingLeft,
      paddingRight: effectivePaddingRight,
      paddingTop: effectivePaddingTop,
      paddingBottom: effectivePaddingBottom,
      textAlignVertical: multiline ? 'top' : 'center',
    },
  ]);

  return (
    <View style={containerStyle}>
      {InputLeftElement || leftElement}
      <TextInput
        ref={ref}
        style={textStyle}
        editable={!(isDisabled || isReadOnly)}
        placeholderTextColor={placeholderColor}
        selectionColor={resolvedSelectionColor}
        multiline={multiline}
        {...rest}
      />
      {InputRightElement || rightElement}
    </View>
  );
};

const defaultContainer = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  height: 44,
  borderWidth: 1,
  borderRadius: 6,
};

const defaultPaddingHorizontal = 12;
const defaultPaddingVertical = 6;

const styles = StyleSheet.create({
  textInput: {
    flex: 1,
    height: '100%',
  },
});

export default memo(forwardRef(Input));
