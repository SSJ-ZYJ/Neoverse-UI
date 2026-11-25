import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { UiAvatar } from './components/display/avatar';
import { UiPagination } from './components/navigation/pagination';
import { UiTabs } from './components/navigation/tabs';

test('React tabs expose labels, tab selection and labelled panels on the server', () => {
  const html = renderToStaticMarkup(
    <UiTabs
      options={[
        { value: 'profile', label: 'Profile' },
        { value: 'events', label: 'Events' },
      ]}
      ariaLabel="Member sections"
      defaultValue="events"
    >
      {(value) => <p>{value}</p>}
    </UiTabs>,
  );
  expect(html).toContain('role="tablist"');
  expect(html).toContain('role="tabpanel"');
  expect(html).toContain('aria-selected="true"');
  expect(html).toContain('<p>events</p>');
});

test('React avatar and pagination preserve readable accessible state', () => {
  const avatar = renderToStaticMarkup(<UiAvatar name="Lin Chen" />);
  expect(avatar).toContain('role="img"');
  expect(avatar).toContain('aria-label="Lin Chen"');
  expect(avatar).toContain('ui-avatar--rounded');
  expect(avatar).toContain('>LC</span>');
  const circleAvatar = renderToStaticMarkup(<UiAvatar name="Lin Chen" shape="circle" />);
  expect(circleAvatar).toContain('ui-avatar--circle');
  expect(circleAvatar).not.toContain('ui-avatar--rounded');
  const iconAvatar = renderToStaticMarkup(<UiAvatar name="Anonymous" placeholder="icon" />);
  expect(iconAvatar).toContain('ui-avatar__icon');
  expect(iconAvatar).toContain('aria-label="Anonymous"');
  expect(iconAvatar).not.toContain('ui-avatar__fallback');
  expect(iconAvatar).toContain('<svg');
  const pagination = renderToStaticMarkup(
    <UiPagination
      page={3}
      totalPages={12}
      ariaLabel="Pages"
      previousLabel="Previous"
      nextLabel="Next"
      pageLabel="Page"
      onPageChange={() => undefined}
    />,
  );
  expect(pagination).toContain('aria-current="page"');
  expect(pagination).toContain('aria-label="Page 3"');
  expect(pagination).toContain('aria-label="Next"');
  const empty = renderToStaticMarkup(
    <UiPagination
      page={1}
      totalPages={0}
      ariaLabel="Pages"
      previousLabel="Previous"
      nextLabel="Next"
      pageLabel="Page"
      onPageChange={() => undefined}
    />,
  );
  expect(empty).not.toContain('aria-current="page"');
  expect(empty).not.toContain('aria-label="Page 1"');
});
