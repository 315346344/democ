import { useState, useEffect } from "react";
import {
  Page,
  Card,
  TextField,
  Button,
  BlockStack,
  Text,
} from "@shopify/polaris";

export default function AppIndex() {
  const [endAt, setEndAt] = useState("");
  const [loading, setLoading] = useState(false);

  // 进入页面时读取已保存的设置
  useEffect(() => {
    fetch("/api/settings/countdown")
      .then((r) => r.json())
      .then((data) => {
        if (data?.endAt) setEndAt(data.endAt);
      });
  }, []);

  async function save() {
    setLoading(true);
    const r = await fetch("/api/settings/countdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endAt }),
    });
    setLoading(false);
    alert(r.ok ? "Saved" : "Save failed");
  }

  return (
    <Page title="Countdown Settings">
      <Card>
        <BlockStack gap="400">
          <Text as="p">
            设置倒计时结束时间（ISO 格式，带时区）
          </Text>
          <TextField
            label="End time"
            value={endAt}
            onChange={setEndAt}
            placeholder="2026-01-16T12:00:00+09:00"
            autoComplete="off"
          />
          <Button variant="primary" loading={loading} onClick={save}>
            Save
          </Button>
        </BlockStack>
      </Card>
    </Page>
  );
}
