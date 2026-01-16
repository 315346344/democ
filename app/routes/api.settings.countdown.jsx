// import { json } from "@shopify/remix-oxygen"; // React Router 模板也支持
const json = (data, init) =>
  new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

import { authenticate } from "../shopify.server";

const NAMESPACE = "app_settings";
const KEY = "countdown_end_at";

/**
 * GET /api/settings/countdown
 * 读取倒计时配置
 */
export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  // 1. 拿当前 AppInstallation ID
  const appInstallRes = await admin.graphql(`
    query {
      currentAppInstallation {
        id
      }
    }
  `);

  const appInstallData = await appInstallRes.json();
  const ownerId = appInstallData.data.currentAppInstallation.id;

  // 2. 读 metafield
  const metafieldRes = await admin.graphql(`
    query ($ownerId: ID!) {
      node(id: $ownerId) {
        ... on AppInstallation {
          metafield(namespace: "${NAMESPACE}", key: "${KEY}") {
            value
          }
        }
      }
    }
  `, {
    variables: { ownerId },
  });

  const metafieldData = await metafieldRes.json();
  const value =
    metafieldData.data.node.metafield?.value ?? "";

  return json({ endAt: value });
}

/**
 * POST /api/settings/countdown
 * 保存倒计时配置
 */
export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const body = await request.json();
  const { endAt } = body;

  // 1. 拿 AppInstallation ID
  const appInstallRes = await admin.graphql(`
    query {
      currentAppInstallation {
        id
      }
    }
  `);

  const appInstallData = await appInstallRes.json();
  const ownerId = appInstallData.data.currentAppInstallation.id;

  // 2. 写 metafield（app-owned）
  const res = await admin.graphql(`
    mutation ($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      metafields: [
        {
          namespace: NAMESPACE,
          key: KEY,
          type: "single_line_text_field",
          value: endAt,
          ownerId,
        },
      ],
    },
  });

  const data = await res.json();
  if (data.data.metafieldsSet.userErrors.length > 0) {
    return json({ ok: false }, { status: 400 });
  }

  return json({ ok: true });
}
