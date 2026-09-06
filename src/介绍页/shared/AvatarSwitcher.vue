<script setup lang="ts">
import _, { debounce } from 'lodash';
import { CDNManager } from './cdnManager';
import { vTooltip } from './tooltip';

const { path, cdn, manifest } = defineProps<{
  path: string;
  cdn: CDNManager;
  manifest: { repo: string; path: string };
}>();

const PATH_OPEN = `${path}.Open`;
function loadOpen(): boolean {
  const variables = getVariables({ type: 'global' });
  return _.get(variables, PATH_OPEN, false);
}
const open = ref(loadOpen());

function saveStates() {
  const variables = getVariables({ type: 'global' });
  if (_.isEqual(_.get(variables, PATH_OPEN, false), open.value)) {
    return;
  }
  updateVariablesWith(
    variables => {
      if (!open.value) _.unset(variables, PATH_OPEN);
      else _.set(variables, PATH_OPEN, open.value);
      return variables;
    },
    { type: 'global' },
  );
}

watch(open, debounce(saveStates, 3000), { deep: true });

$(window).on('pagehide', () => {
  saveStates();
});

type AvatarInfo = z.infer<typeof AvatarInfo>;
const AvatarInfo = z.object({
  name: z.string(),
  desc: z.optional(z.string()),
  repo: z.string(),
  path: z.string(),
});
type AvatarManifest = z.infer<typeof AvatarManifest>;
const AvatarManifest = z.array(AvatarInfo);

// 状态管理
interface GalleryItem extends AvatarInfo {
  blobUrl?: string;
  rawBlob?: Blob;
  error: boolean;
}
const gallery = ref<GalleryItem[]>([]);
const manifestError: Ref<string | null> = ref(null);
const pendingAvatarIndex = ref<number | null>(null); // 当前弹出确认框的卡面索引
const isApplying = ref(false); // 是否正在应用中
// function getCdnUrls(repo: string, path: string) {
//   return [
//     `https://fastly.jsdelivr.net/gh/${repo}@main/${path}`,
//     `https://gcore.jsdelivr.net/gh/${repo}@main/${path}`,
//     `https://cdn.jsdelivr.net/gh/${repo}@main/${path}`,
//     `https://testingcf.jsdelivr.net/gh/${repo}@main/${path}`,
//   ];
// }
// 多源获取 Blob
async function resolveFromRepo(repo: string, path: string): Promise<Blob | null> {
  try {
    // const resp = await cdn.fetch(`gh/${repo}@latest/${path}`);
    const resp = await cdn.fetchGitHub(repo, path);
    if (!resp.ok) throw new Error(`加载失败:${resp.status}；${resp.statusText}`);
    return await resp.blob();
  } catch (e) {
    console.warn('获取 Blob 失败:', repo, path);
  }

  return null;
}

async function loadGalleryImages() {
  for (const item of gallery.value) {
    if (item.blobUrl) continue;
    item.error = false;

    try {
      const blob = await resolveFromRepo(item.repo, item.path);
      if (blob) {
        item.rawBlob = blob;
        item.blobUrl = URL.createObjectURL(blob);
      } else {
        item.error = true;
      }
    } catch {
      item.error = true;
    }
  }
}

async function initGallery() {
  if (gallery.value.length > 0 && !manifestError.value) {
    loadGalleryImages();
    return;
  }
  manifestError.value = null;

  // const resp = await cdn.fetch('gh/JesterRomut/tavern-resources@main/character/OZ/avatar/index.json');
  const resp = await cdn.fetchGitHub(manifest.repo, manifest.path);
  if (!resp.ok) {
    manifestError.value = `加载失败：${resp.status}${resp.statusText ? ' - ' + resp.statusText : ''}`;
    return;
  }
  const rawJson = await resp.json();

  // Zod 类型校验
  const parsed = AvatarManifest.safeParse(rawJson);
  if (!parsed.success) {
    manifestError.value = `类型校验失败：需要更新角色卡。`;
    return;
  }
  const manifes = parsed.data;

  gallery.value = manifes.map(item => ({
    ...item,
    loading: false,
    error: false,
  }));

  loadGalleryImages();
}

function selectAvatar(index: number) {
  const target = gallery.value[index];
  if (!target.rawBlob || isApplying.value) return;
  pendingAvatarIndex.value = index;
}

async function confirmApplyAvatar(index: number) {
  const target = gallery.value[index];
  if (!target.rawBlob) return;
  isApplying.value = true;
  try {
    await updateCharacterAvatar(target.rawBlob);
    pendingAvatarIndex.value = null;
  } catch (err) {
    console.error('更新卡面失败:', err);
  } finally {
    isApplying.value = false;
  }
}

async function updateCharacterAvatar(blob: Blob) {
  const chrName = getCurrentCharacterName();
  if (!chrName) {
    console.error('角色卡名称为null！');
    return;
  }
  await updateCharacterWith(chrName, async character => {
    character.avatar = blob;
    return character;
  });
}

const online = ref(window.navigator.onLine);

async function checkConnectivity() {
  if (!window.navigator.onLine) {
    online.value = false;
    return;
  }
  cdn.reset();
  try {
    // const ver = await cdn.fetchLatestVersion(manifest.repo);
    // // const host = await cdn.getFastestHost();
    // online.value = ver !== null;

    // console.log(ver);
    // if (!ver) {
    const host = await cdn.getFastestHost();
    online.value = host !== null;
  } catch {
    online.value = false;
  }

  if (online.value && open.value) {
    initGallery();
  }
}

const handleOnline = () => {
  checkConnectivity();
};

const handleOffline = () => {
  online.value = false;
  cdn.reset();
};

onMounted(async () => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  await checkConnectivity();
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);

  gallery.value.forEach(item => {
    if (item.blobUrl) URL.revokeObjectURL(item.blobUrl);
  });
});
</script>
<script lang="ts">
export default {
  directives: {
    tooltip: vTooltip,
  },
};
</script>
<template>
  <section v-if="!online" class="oz-section disabled" aria-disabled @click="checkConnectivity">
    <h3>
      <span><i class="fa-solid fa-image-portrait"></i> 卡面切换</span><u>离线模式不可用</u>
    </h3>
  </section>
  <section v-else class="oz-section">
    <h3
      :class="{ 'is-open': open }"
      @click="
        () => {
          open = !open;
          if (open) {
            initGallery();
          } else {
            pendingAvatarIndex = null;
          }
        }
      "
    >
      <span><i class="fa-solid fa-image-portrait"></i> 卡面切换</span>
    </h3>
    <Transition name="slide-fade">
      <div v-if="open">
        <!-- Manifest 清单加载失败 -->
        <div v-if="manifestError !== null" class="manifest-error" @click="initGallery">
          <p>
            <i class="fa-regular fa-moon"></i>
            <span>未能连接维度X……点击重试</span>
          </p>
          <p>{{ manifestError }}</p>
        </div>
        <div v-else-if="gallery.length <= 0" class="manifest-loading">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <span>正在获取卡面列表...</span>
        </div>
        <div v-else class="avatar-gallery">
          <div
            v-for="(item, idx) in gallery"
            :key="item.path"
            v-tooltip="item.desc || item.name"
            class="gallery-item"
            :class="{ active: pendingAvatarIndex === idx }"
            @click="selectAvatar(idx)"
          >
            <!-- 加载失败 -->
            <div
              v-if="item.error"
              v-tooltip="'点击重试'"
              class="image-placeholder error"
              @click.stop="loadGalleryImages"
            >
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>加载失败</span>
            </div>
            <!-- 骨架/加载中 -->
            <div v-else-if="!item.blobUrl" class="image-placeholder">
              <i class="fa-solid fa-spinner fa-spin"></i>
            </div>
            <!-- 图片正常展示 -->
            <div v-else class="image-wrapper">
              <img :src="item.blobUrl" :alt="item.name" loading="lazy" />
            </div>
            <!-- 卡面信息 -->
            <div class="item-meta">
              <span class="item-name">{{ item.name }}</span>
            </div>
            <!-- Popconfirm 确认浮层 -->
            <Transition name="pop-fade">
              <div v-if="pendingAvatarIndex === idx" class="popconfirm-popover" @click.stop>
                <div class="popconfirm-title">
                  <i class="fa-solid fa-circle-question"></i>
                  <span>更换为此卡面？</span>
                </div>
                <div class="popconfirm-actions">
                  <button class="btn btn-cancel" :disabled="isApplying" @click="pendingAvatarIndex = null">取消</button>
                  <button class="btn btn-confirm" :disabled="isApplying" @click="confirmApplyAvatar(idx)">
                    <i v-if="isApplying" class="fa-solid fa-spinner fa-spin"></i>
                    <span v-else>确认</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>
<style lang="scss">
@use 'section.scss';
@use 'transition.scss';

.disabled {
  color: #888;
  h3 {
    align-items: center;
  }
  u {
    font-size: 0.8rem;
    display: contents;
    font-weight: lighter;
  }
}

.manifest-error,
.manifest-loading {
  color: #888;
  font-style: italic;
  padding-left: 0.5rem;
  padding-top: 0.5rem;

  .fa-regular {
    align-self: baseline;
  }
}

.avatar-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 0.5rem;
  padding-top: 1rem;
}
.gallery-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  &:hover {
    border-color: var(--oz-highlight);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  &.active {
    border-color: var(--oz-highlight);
  }
}
.image-wrapper,
.image-placeholder {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}
.image-placeholder {
  flex-direction: column;
  color: var(#aaa);
  font-size: 0.85em;
  &.error {
    color: #ff6b6b;
    cursor: pointer;
  }
}
.item-meta {
  margin-top: 6px;
  width: 100%;
  text-align: center;
  .item-name {
    display: block;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(#eee);
  }
}
/* Popconfirm 气泡框样式 */
.popconfirm-popover {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: rgba(18, 18, 18, 0.92);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  gap: 8px;
  .popconfirm-title {
    font-size: 0.8rem;
    text-align: center;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(#fff);
    i {
      color: var(--oz-highlight);
    }
  }
  .popconfirm-actions {
    display: flex;
    gap: 6px;
    width: 100%;
    justify-content: center;
    .btn {
      padding: 3px 8px;
      font-size: 0.75rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      &.btn-cancel {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
        }
      }
      &.btn-confirm {
        background: var(--oz-highlight);
        color: #fff;
        &:hover:not(:disabled) {
          filter: brightness(1.1);
        }
      }
    }
  }
}
/* 动效 */
.pop-fade-enter-active,
.pop-fade-leave-active {
  transition: opacity 0.15s ease;
}
.pop-fade-enter-from,
.pop-fade-leave-to {
  opacity: 0;
}
</style>
