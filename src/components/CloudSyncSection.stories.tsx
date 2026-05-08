import type { Meta, StoryObj } from "@storybook/react";
import { createDefaultCloudSyncStatus } from "../helpers/cloudSyncData";
import { CloudSyncSectionView } from "./CloudSyncSection";

const noopAsync = async () => true;

const meta = {
  title: "Pages/Settings",
  component: CloudSyncSectionView,
  parameters: {
    layout: "fullscreen"
  },
  args: {
    connect: noopAsync,
    disconnect: noopAsync,
    error: null,
    isLoading: false,
    isPending: false,
    pendingProvider: null,
    status: createDefaultCloudSyncStatus(),
    syncNow: noopAsync
  }
} satisfies Meta<typeof CloudSyncSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Loading: Story = {
  args: {
    isLoading: true
  }
};
