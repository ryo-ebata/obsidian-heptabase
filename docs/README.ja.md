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
- **ライブラリフィルター** — Vaultを再読込せず、タグ・フォルダで絞り込み、更新日時・タイトルで並べ替え
- **Canvas へドラッグ&ドロップ** — 見出しを開いている Canvas にドラッグして新規ノートを作成
- **スマートなコンテンツ抽出** — ネストされた見出しを含むセクション全体を自動抽出
- **自動ファイル作成** — サニタイズされたファイル名で新規ファイルを作成し、名前の衝突も自動処理
- **ノードサイズの設定** — Canvas ノードのデフォルトの幅と高さを設定可能
- **出力先の設定** — 抽出ノートの保存フォルダとファイル名プレフィックスを指定可能
- **バックリンクオプション** — 抽出後に元ノートにバックリンクを残すことが可能
- **抽出元の記録** — 新しい概念カードに元ノート・見出し・Canvas・抽出日時を記録
- **カードコンテキスト** — 現在のカードの抽出元・バックリンク・配置先Canvasを表示
- **Canvasから記事へ移動** — Canvas上のファイルノードを選択してサイドバーエディタで開く
- **Canvas内検索とフォーカス** — 現在のCanvasにあるカード・テキスト・グループ・リンクを検索してズーム
- **Canvas選択ツール** — 選択カードの整列・等間隔配置・接続・グループ化と、同期されたUndo/Redoに対応
- **高速カード作成** — 重ならないカードを作成し、フォーカス済みタイトル欄ですぐ命名
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

Canvas上で複数ノードを選択し、Obsidianのコマンドパレットから整列・等間隔配置を実行できる。整列には2ノード、等間隔配置には3ノード以上が必要。

**Create new card**コマンドでは、表示中のCanvas中央へ選択済みカードを作成する。Canvasの空白をCmd/Ctrl + ダブルクリックすると、その位置へ作成できる。作成後はタイトル全体が選択されるため、入力すると`Untitled`を即座に置き換えられる。

## 設定

| 設定項目               | 説明                                                                                   | デフォルト |
| ---------------------- | -------------------------------------------------------------------------------------- | ---------- |
| Extracted files folder | 抽出した見出しファイルの保存先フォルダ。空の場合はソースファイルと同じフォルダに保存。 | _(空)_     |
| Default node width     | 新しい Canvas ノードの幅（200〜800）                                                   | 400        |
| Default node height    | 新しい Canvas ノードの高さ（100〜600）                                                 | 300        |
| File name prefix       | 抽出ファイル名のプレフィックス                                                         | _(空)_     |
| Leave backlink         | 抽出後に元ノートにバックリンクを残す                                                   | オフ       |

## 開発

UI変更は[UX principles](UX_PRINCIPLES.md)に従う。なめらかさとデザイン品質を、このプラグインのリリース基準として扱う。

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

### Obsidian実機テスト

既存Vaultを変更せず、サンプルノート・Canvas・このプラグインへのリンクを持つ専用Vaultを作成する：

```bash
pnpm setup:device
```

初回のみObsidianの「保管庫としてフォルダを開く」から `.dev/ux-audit-vault` を選び、ローカルVaultを信頼して `Heptabase-like Heading Explorer` を有効化する。以後は次のコマンドで直接開ける。

```bash
pnpm open:device
```

`UX監査Canvas.canvas` と `UX監査チェックリスト.md` を使い、ライト・ダーク、狭幅、キーボード、検索、ドラッグ&ドロップを確認する。反復開発中は `pnpm dev` を実行する。Hot Reloadを使わない場合は、Obsidianの「設定 → コミュニティプラグイン → プラグインの再読み込み」で最新ビルドを反映する。

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
