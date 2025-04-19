declare module '@brnho/react-native-context-menu' {
  import type { ReactNode } from 'react';
  import type { ViewProps } from 'react-native';

  interface MenuItem {
    text: string;
    icon?: {
      type: string;
      name: string;
      size: number;
    };
    onPress?: () => void;
    isTitle?: boolean;
    isDestructive?: boolean;
    withSeparator?: boolean;
  }

  interface ContextMenuContainerProps extends ViewProps {
    menuItems: MenuItem[];
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
    borderRadius?: number;
  }

  interface ContextMenuProviderProps {
    children: ReactNode;
    setScrollEnabled?: (enabled: boolean) => void;
    SCREEN_SHRINK_FACTOR?: number;
    EXPAND_FACTOR?: number;
    FADE_SPEED?: number;
    APPEAR_SPEED?: number;
    BLUR_INTENSITY?: number;
    MENU_ITEM_HEIGHT?: number;
    DIVIDER_HEIGHT?: number;
    MENU_WIDTH?: number;
    MENU_MARGIN?: number;
  }

  export const ContextMenuProvider: React.FC<ContextMenuProviderProps>;
  export const ContextMenuContainer: React.FC<ContextMenuContainerProps>;
}
