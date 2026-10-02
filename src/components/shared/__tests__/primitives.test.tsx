import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';
import { Drawer } from '../Drawer';
import { Toast } from '../Toast';
import { StatusBadge } from '../StatusBadge';
import { ChannelIcon, ChannelBadge } from '../ChannelIcon';
import { Table } from '../Table';
import { StoreProvider, useStore } from '../../../state/store';

describe('Shared Primitives', () => {
  describe('Modal', () => {
    it('renders null when isOpen is false', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          <p>Modal Content</p>
        </Modal>
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders title and children when open, respects size variants', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Small Modal" size="sm">
          <p>Small Content</p>
        </Modal>
      );
      expect(screen.getByText('Small Modal')).toBeInTheDocument();
      expect(screen.getByText('Small Content')).toBeInTheDocument();
      const contentBox = screen.getByText('Small Modal').closest('div')!.parentElement!;
      expect(contentBox.style.maxWidth).toBe('400px');

      rerender(
        <Modal isOpen={true} onClose={vi.fn()} title="Large Modal" size="lg">
          <p>Large Content</p>
        </Modal>
      );
      expect(screen.getByText('Large Modal')).toBeInTheDocument();
      expect(contentBox.style.maxWidth).toBe('720px');
    });

    it('handles close on overlay click and close button, but stops propagation on inner click', () => {
      const onClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={onClose} title="Interactive Modal">
          <button>Inside Modal</button>
        </Modal>
      );

      // Inner click does not call onClose
      fireEvent.click(screen.getByRole('button', { name: 'Inside Modal' }));
      expect(onClose).not.toHaveBeenCalled();

      // Close button calls onClose
      const closeBtn = screen.getByRole('button', { name: '' });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);

      // Overlay click calls onClose
      const overlay = screen.getByText('Interactive Modal').closest('div')!.parentElement!.parentElement!;
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('Drawer', () => {
    it('renders null when isOpen is false', () => {
      const { container } = render(
        <Drawer isOpen={false} onClose={vi.fn()} title="Test Drawer">
          <p>Drawer Content</p>
        </Drawer>
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders title, children, custom width and handles close interactions', () => {
      const onClose = vi.fn();
      render(
        <Drawer isOpen={true} onClose={onClose} title="Custom Drawer" width={500}>
          <button>Inside Drawer</button>
        </Drawer>
      );

      expect(screen.getByText('Custom Drawer')).toBeInTheDocument();
      const panel = screen.getByText('Custom Drawer').closest('div')!.parentElement!;
      expect(panel.style.width).toBe('500px');

      // Inner click stops propagation
      fireEvent.click(screen.getByRole('button', { name: 'Inside Drawer' }));
      expect(onClose).not.toHaveBeenCalled();

      // Close button
      const closeBtn = screen.getByRole('button', { name: '' });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);

      // Overlay click
      const overlay = panel.parentElement!;
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('Toast', () => {
    function ToastTester() {
      const { showToast } = useStore();
      return (
        <div>
          <button onClick={() => showToast('Operation successful', 'success')}>Add Success</button>
          <button onClick={() => showToast('Warning alert', 'warning')}>Add Warning</button>
          <button onClick={() => showToast('Error occurred', 'danger')}>Add Danger</button>
          <Toast />
        </div>
      );
    }

    it('renders toasts across variants and allows dismissal', async () => {
      render(
        <StoreProvider>
          <ToastTester />
        </StoreProvider>
      );

      // Initially null
      expect(screen.queryByText('Operation successful')).not.toBeInTheDocument();

      // Trigger toasts
      fireEvent.click(screen.getByRole('button', { name: 'Add Success' }));
      expect(await screen.findByText('Operation successful')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Add Warning' }));
      expect(await screen.findByText('Warning alert')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Add Danger' }));
      expect(await screen.findByText('Error occurred')).toBeInTheDocument();

      // Dismiss first toast
      const closeBtns = screen.getAllByRole('button', { name: '' });
      fireEvent.click(closeBtns[0]);
      expect(screen.queryByText('Operation successful')).not.toBeInTheDocument();
    });
  });

  describe('StatusBadge', () => {
    it('renders with appropriate styles for various statuses and sizes', () => {
      const { rerender } = render(<StatusBadge status="Delivered" size="md" />);
      const badge = screen.getByText('Delivered');
      expect(badge).toBeInTheDocument();
      expect(badge.style.background).toBe('var(--success-bg)');
      expect(badge.style.fontSize).toBe('11px');

      rerender(<StatusBadge status="Cancelled" size="sm" />);
      const cancelledBadge = screen.getByText('Cancelled');
      expect(cancelledBadge.style.background).toBe('var(--danger-bg)');
      expect(cancelledBadge.style.fontSize).toBe('10.5px');

      rerender(<StatusBadge status="CustomUnknown" />);
      const fallbackBadge = screen.getByText('CustomUnknown');
      expect(fallbackBadge.style.background).toBe('var(--surface-0)');
    });
  });

  describe('ChannelIcon & ChannelBadge', () => {
    it('renders icons for all supported channels and labels when requested', () => {
      const channels = ['messenger', 'instagram', 'whatsapp', 'telegram', 'gmail', 'tiktok', 'website'] as const;
      const { rerender } = render(<ChannelIcon channel="messenger" showLabel />);
      expect(screen.getByText('Messenger')).toBeInTheDocument();

      for (const ch of channels) {
        rerender(
          <div data-testid={`wrap-${ch}`}>
            <ChannelIcon channel={ch} size={20} />
            <ChannelBadge channel={ch} size={16} />
          </div>
        );
        expect(screen.getByTestId(`wrap-${ch}`).querySelector('svg')).toBeTruthy();
      }
    });
  });

  describe('Table', () => {
    const columns = [
      { key: 'name', label: 'Item Name' },
      { key: 'price', label: 'Price (EGP)' }
    ];

    it('renders emptyState when data is empty', () => {
      render(
        <Table
          columns={columns}
          data={[]}
          renderRow={() => null}
          emptyState={<div>No data records found</div>}
        />
      );
      expect(screen.getByText('No data records found')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('renders table headers and rows when data is populated', () => {
      const items = [
        { id: '1', name: 'Leather Bag', price: 900 },
        { id: '2', name: 'Sneakers', price: 1200 }
      ];

      render(
        <Table
          columns={columns}
          data={items}
          renderRow={(item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.price} EGP</td>
            </tr>
          )}
        />
      );

      expect(screen.getByText('Item Name')).toBeInTheDocument();
      expect(screen.getByText('Price (EGP)')).toBeInTheDocument();
      expect(screen.getByText('Leather Bag')).toBeInTheDocument();
      expect(screen.getByText('900 EGP')).toBeInTheDocument();
      expect(screen.getByText('Sneakers')).toBeInTheDocument();
      expect(screen.getByText('1200 EGP')).toBeInTheDocument();
    });
  });
});
