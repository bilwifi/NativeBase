import { useWindowDimensions } from 'react-native';
import {
  getClosestBreakpoint,
  hasValidBreakpointFormat,
  findLastValidBreakpoint,
} from '../theme/tools';
import { useTheme } from './../hooks/useTheme';
import type { ResponsiveValue } from '../components/types/responsiveValue';

type UseBreakpointValueParam = ResponsiveValue<any>;

export function useBreakpointValue(values: UseBreakpointValueParam) {
  let windowWidth = useWindowDimensions()?.width;
  const theme = useTheme();

  if (hasValidBreakpointFormat(values, theme.breakpoints)) {
    let currentBreakpoint = getClosestBreakpoint(
      theme.breakpoints,
      windowWidth
    );
    return findLastValidBreakpoint(
      values,
      theme.breakpoints,
      currentBreakpoint
    );
  } else {
    return values;
  }
}
