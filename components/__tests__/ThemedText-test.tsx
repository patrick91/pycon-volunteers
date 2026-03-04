import * as React from 'react';
import { act, create } from 'react-test-renderer';

import { ThemedText } from '../ThemedText';

it(`renders correctly`, async () => {
  let tree: ReturnType<typeof create> | undefined;

  await act(async () => {
    tree = create(<ThemedText>Snapshot test!</ThemedText>);
  });

  expect(tree?.toJSON()).toMatchSnapshot();
});
