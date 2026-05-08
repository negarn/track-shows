import type { Meta, StoryObj } from "@storybook/react";
import { WatchlistPage } from "./WatchlistPage";

const meta = {
  title: "Pages/Watchlist",
  component: WatchlistPage,
  parameters: {
    layout: "fullscreen"
  },
  args: {
    highlightedShowId: null,
    isLoading: false,
    nextDisabled: true,
    onMarkAiredWatched: () => undefined,
    onNextPage: () => undefined,
    onPreviousPage: () => undefined,
    onRefresh: () => undefined,
    onRemove: () => undefined,
    onToggleWatched: () => undefined,
    previousDisabled: true,
    shows: [],
    syncingId: null
  }
} satisfies Meta<typeof WatchlistPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Loading: Story = {
  args: {
    isLoading: true
  }
};
