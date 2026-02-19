# Obsidian Heptabase

![Obsidian](https://img.shields.io/badge/Obsidian-%3E%3D1.5.0-blueviolet)
![License](https://img.shields.io/badge/license-MIT-green)

Obsidian Canvas 向けの Heptabase 風見出しエクスプローラー — ノートを検索・閲覧し、見出しを Canvas にドラッグ&ドロップして新規ノートを作成できます。

[English](../README.md)

<!-- TODO: デモ GIF/スクリーンショットを追加 -->

## Heptabase とは？

[Heptabase](https://heptabase.com/) は、ノートをカードに分解してホワイトボード上に配置できるビジュアルナレッジ管理ツールです。このプラグインは、Obsidian Vault 内の見出しセクションを抽出して Canvas 上に個別のノートとして配置することで、同様のワークフローを実現します。

## 機能

- **サイドバー見出しエクスプローラー** — 右サイドバーで全ノートと見出し階層を閲覧
- **デバウンス付き検索** — リアルタイムでノートをタイトルで絞り込み
- **Canvas へドラッグ&ドロップ** — 見出しを開いている Canvas にドラッグして新規ノートを作成
- **スマートなコンテンツ抽出** — ネストされた見出しを含むセクション全体を自動抽出
- **自動ファイル作成** — サニタイズされたファイル名で新規ファイルを作成し、名前の衝突も自動処理
- **ノードサイズの設定** — Canvas ノードのデフォルトの幅と高さを設定可能
- **出力先の設定** — 抽出ノートの保存フォルダとファイル名プレフィックスを指定可能
- **バックリンクオプション** — 抽出後に元ノートにバックリンクを残すことが可能
- **キーボードアクセシブル** — 完全なキーボードナビゲーション対応

## インストール

### 手動インストール

1. このリポジトリをクローンまたはダウンロード
2. 依存関係のインストールとビルド：
   ```bash
   pnpm install
   pnpm build
   ```
3. `main.js`、`manifest.json`、`styles.css`（存在する場合）を Vault のプラグインディレクトリにコピー：
   ```
   <vault>/.obsidian/plugins/obsidian-heptabase/
   ```
4. Obsidian を再起動し、設定 > コミュニティプラグイン でプラグインを有効化

## 使い方

1. Obsidian で Canvas を開く
2. リボン（左サイドバー）の **list-tree** アイコンをクリックして Heading Explorer を開く
3. エクスプローラーパネルでノートを閲覧または検索
4. ノートを展開して見出し階層を確認
5. 見出しを Canvas にドラッグ — 抽出されたセクション内容で新規ノートが作成される

## 設定

| 設定項目               | 説明                                                                                   | デフォルト |
| ---------------------- | -------------------------------------------------------------------------------------- | ---------- |
| Extracted files folder | 抽出した見出しファイルの保存先フォルダ。空の場合はソースファイルと同じフォルダに保存。 | _(空)_     |
| Default node width     | 新しい Canvas ノードの幅（200〜800）                                                   | 400        |
| Default node height    | 新しい Canvas ノードの高さ（100〜600）                                                 | 300        |
| File name prefix       | 抽出ファイル名のプレフィックス                                                         | _(空)_     |
| Leave backlink         | 抽出後に元ノートにバックリンクを残す                                                   | オフ       |

## 開発

### 前提条件

- [Node.js](https://nodejs.org/)（LTS）
- [pnpm](https://pnpm.io/)

### セットアップ

```bash
pnpm install
```

### コマンド

```bash
pnpm dev        # ウォッチモードでビルド
pnpm build      # プロダクションビルド
pnpm test       # テスト実行
pnpm lint       # oxlint でリント
pnpm format     # oxfmt で自動フォーマット
```

## コントリビューション

コントリビューション大歓迎です！ [Issue](../../issues) の作成やプルリクエストの送信をお気軽にどうぞ。

1. リポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/my-feature`）
3. 変更を加え、テストを追加
4. `pnpm test && pnpm lint` で検証
5. プルリクエストを送信

## ライセンス

[MIT](../LICENSE)

## 謝辞

[Heptabase](https://heptabase.com/) とそのビジュアルナレッジ管理のアプローチに触発されました。
