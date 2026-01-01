let followingData = [];
let filteredData = [];

function copyScript(event) {
    const btn = event.target;
    const originalText = btn.textContent;
    const scriptCode = generateChzzkScript();

    navigator.clipboard.writeText(scriptCode).then(() => {
        btn.textContent = '✓ 복사됨';
        btn.classList.add('btn-success');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('btn-success');
        }, 2000);
    }).catch((err) => {
        console.error('복사 실패:', err);
        alert('복사 실패! 브라우저가 클립보드 접근을 허용하지 않습니다.');
    });
}

async function pasteAndLoad(event) {
    const btn = event.target;
    const originalText = btn.textContent;

    try {
        btn.textContent = '읽는 중...';
        const clipboardText = await navigator.clipboard.readText();

        btn.textContent = '처리 중...';
        const data = JSON.parse(clipboardText);

        if (!data.content || !data.content.followingList) {
            throw new Error('올바른 형식이 아닙니다');
        }

        followingData = data.content.followingList;
        filteredData = followingData;
        renderGrid();
        updateStats();

        btn.textContent = '✓ 완료!';
        btn.classList.add('btn-success');

        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('btn-success');
        }, 2000);

    } catch (error) {
        btn.textContent = '✗ 실패';
        btn.classList.add('btn-error');

        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('btn-error');
        }, 2000);

        if (error.name === 'NotAllowedError') {
            alert('클립보드 접근이 거부되었습니다.\n브라우저 설정에서 클립보드 권한을 허용해주세요.');
        } else {
            alert('JSON 파싱 오류: ' + error.message);
        }
        console.error(error);
    }
}

function clearData() {
    if (confirm('데이터를 초기화하시겠습니까?')) {
        followingData = [];
        filteredData = [];
        document.getElementById('searchInput').value = '';
        renderGrid();
        updateStats();
    }
}

function updateStats() {
    const liveCount = filteredData.filter(item => item.streamer && item.streamer.openLive).length;
    const totalCountEl = document.getElementById('totalCount');
    const liveCountEl = document.getElementById('liveCount');

    totalCountEl.innerHTML = filteredData.length !== followingData.length
        ? `<i class="bi bi-people-fill"></i> ${filteredData.length}명 / 총 ${followingData.length}명`
        : `<i class="bi bi-people-fill"></i> 총 ${followingData.length}명`;

    liveCountEl.innerHTML = liveCount > 0
        ? `<i class="bi bi-broadcast text-danger"></i> 방송중 ${liveCount}명`
        : '';
}

function sortByDate(order) {
    if (followingData.length === 0) {
        alert('먼저 데이터를 불러와주세요');
        return;
    }

    followingData.sort((a, b) => {
        const dateA = new Date(a.channel.personalData.following.followDate);
        const dateB = new Date(b.channel.personalData.following.followDate);

        return order === 'asc' ? dateA - dateB : dateB - dateA;
    });

    searchByName();
}

function sortByName() {
    if (followingData.length === 0) {
        alert('먼저 데이터를 불러와주세요');
        return;
    }

    followingData.sort((a, b) => {
        return a.channel.channelName.localeCompare(b.channel.channelName, 'ko');
    });

    searchByName();
}

function searchByName() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

    if (!searchTerm) {
        filteredData = followingData;
    } else {
        filteredData = followingData.filter(item =>
            item.channel.channelName.toLowerCase().includes(searchTerm)
        );
    }

    renderGrid();
    updateStats();
}

function formatDate(dateString) {
    return dateString.split(' ')[0];
}

function getDaysSinceFollow(dateString) {
    const followDate = new Date(dateString);
    const now = new Date();
    
    const koreaOffset = 9 * 60;
    const followDateKorea = new Date(followDate.getTime() + koreaOffset * 60 * 1000);
    const nowKorea = new Date(now.getTime() + koreaOffset * 60 * 1000);
    
    followDateKorea.setHours(0, 0, 0, 0);
    nowKorea.setHours(0, 0, 0, 0);
    
    const diffTime = nowKorea - followDateKorea;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function openChannel(channelId) {
    window.open(`https://chzzk.naver.com/${channelId}`, '_blank');
}

function renderGrid() {
    const grid = document.getElementById('grid');
    const emptyState = document.getElementById('emptyState');

    if (followingData.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('d-none');
        return;
    }

    emptyState.classList.add('d-none');

    if (filteredData.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center py-5 empty-state-text"><i class="bi bi-search display-4"></i><p class="mt-3">검색 결과가 없습니다</p></div>';
        return;
    }

    grid.innerHTML = filteredData.map(item => {
        const channel = item.channel;
        const followDate = formatDate(channel.personalData.following.followDate);
        const daysSince = getDaysSinceFollow(channel.personalData.following.followDate);
        const isLive = item.streamer && item.streamer.openLive;

        return `
            <div class="col">
                <div class="card channel-card h-100 border-0 shadow-sm ${isLive ? 'live-card' : ''}" onclick="openChannel('${channel.channelId}')">
                    <div class="position-relative">
                        <img src="${channel.channelImageUrl}"
                             class="card-img-top channel-image"
                             alt="${channel.channelName}"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%236c757d%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2220%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                        ${isLive ? '<span class="badge live-badge position-absolute top-0 start-50 translate-middle-x mt-2"><i class="bi bi-circle-fill pulse-dot"></i> LIVE</span>' : ''}
                    </div>
                    <div class="card-body text-center p-3">
                        <h6 class="card-title fw-bold mb-2 text-truncate">${channel.channelName}</h6>
                        <p class="card-text small mb-1 follow-date-text">
                            <i class="bi bi-calendar-event"></i> ${followDate}
                        </p>
                        <p class="card-text small">
                            <span class="badge follow-days-badge">D+${daysSince}</span>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function generateChzzkScript() {
    return `(async function() {
    console.clear();
    console.log('🔍 팔로우 목록을 가져오는 중...');
    
    if (!window.location.hostname.includes('chzzk.naver.com')) {
        alert('❌ 이 스크립트는 치지직 사이트(chzzk.naver.com)에서만 실행할 수 있습니다!');
        return;
    }
    
    function copyToClipboardFallback(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            return successful;
        } catch (err) {
            document.body.removeChild(textarea);
            return false;
        }
    }
    
    try {
        console.log('📡 첫 페이지 요청 중...');
        const firstResponse = await fetch('https://api.chzzk.naver.com/service/v1/channels/followings?size=505&page=0', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (firstResponse.status === 401) {
            alert('❌ 로그인이 필요합니다!');
            return;
        }
        
        const firstData = await firstResponse.json();
        
        if (firstData.code !== 200) {
            throw new Error('API 요청 실패: ' + (firstData.message || '알 수 없는 오류'));
        }
        
        const totalPage = firstData.content.totalPage;
        const totalCount = firstData.content.totalCount;
        console.log(\`📄 1/\${totalPage} 페이지 로딩 중... (0/\${totalCount})\`);
        
        let allFollowings = [...firstData.content.followingList];
        
        for (let page = 1; page < totalPage; page++) {
            console.log(\`📄 \${page + 1}/\${totalPage} 페이지 로딩 중... (\${allFollowings.length}/\${totalCount})\`);
            
            const response = await fetch(\`https://api.chzzk.naver.com/service/v1/channels/followings?size=505&page=\${page}\`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.code === 200) {
                allFollowings.push(...data.content.followingList);
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        const result = {
            code: 200,
            message: null,
            content: {
                totalCount: allFollowings.length,
                totalPage: totalPage,
                followingList: allFollowings
            }
        };
        
        console.log(\`✅ 총 \${allFollowings.length}명의 팔로우 목록을 불러왔습니다\`);
        
        const jsonString = JSON.stringify(result);
        
        let copySuccess = copyToClipboardFallback(jsonString);
        
        if (!copySuccess && typeof copy === 'function') {
            try {
                copy(jsonString);
                copySuccess = true;
            } catch (err) {
                console.log('⚠️ copy() 함수 실패');
            }
        }
        
        if (copySuccess) {
            alert(\`\${allFollowings.length}명의 팔로우 목록을 불러왔습니다\\n페이지로 돌아가서 '불러오기' 버튼을 클릭하세요\`);
        } else {
            window.temp1 = jsonString;
            console.log('⚠️ 자동 복사 실패. 콘솔에 다음을 입력하세요: copy(temp1)');
            alert(\`\${allFollowings.length}명의 팔로우 목록을 불러왔습니다\\n콘솔에 다음을 입력하세요:\\ncopy(temp1)\`);
        }
        
    } catch (error) {
        console.error('❌ 오류 발생:', error);
        alert('❌ 데이터를 가져오는 중 오류가 발생했습니다: ' + error.message);
    }
})();`;
}

function minimizeData(followingList) {
    return followingList.map(item => ({
        id: item.channel.channelId,
        n: item.channel.channelName,
        i: item.channel.channelImageUrl,
        d: item.channel.personalData.following.followDate,
        l: item.streamer && item.streamer.openLive ? 1 : 0
    }));
}

function restoreData(minimizedList) {
    return minimizedList.map(item => ({
        channel: {
            channelId: item.id,
            channelName: item.n,
            channelImageUrl: item.i,
            personalData: {
                following: {
                    followDate: item.d
                }
            }
        },
        streamer: item.l ? { openLive: true } : null
    }));
}

async function generateShareLink() {
    if (followingData.length === 0) {
        alert('먼저 데이터를 불러와주세요');
        return;
    }

    try {
        // 로딩 표시
        const originalText = event?.target?.textContent;
        if (event?.target) {
            event.target.textContent = '생성 중...';
            event.target.disabled = true;
        }

        // 데이터 최적화
        const minimized = minimizeData(followingData);

        // 서버에 데이터 전송
        const response = await fetch('/api/share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: minimized })
        });

        if (!response.ok) {
            throw new Error('서버 응답 오류');
        }

        const result = await response.json();
        const shareUrl = `${window.location.origin}${window.location.pathname}#${result.id}`;

        // 클립보드에 복사
        await navigator.clipboard.writeText(shareUrl);

        alert(`공유 링크가 클립보드에 복사되었습니다!\n\n총 ${followingData.length}명의 팔로우 목록\nURL 길이: ${shareUrl.length}자`);

        window.location.hash = result.id;

    } catch (error) {
        console.error('공유 링크 생성 실패:', error);
        alert('공유 링크 생성 중 오류가 발생했습니다.\n서버에 연결할 수 없습니다.');
    } finally {
        // 버튼 복구
        if (event?.target) {
            event.target.textContent = originalText;
            event.target.disabled = false;
        }
    }
}

async function loadFromURL() {
    const hash = window.location.hash.substring(1);
    if (!hash) {
        document.getElementById('emptyState').classList.remove('d-none');
        return;
    }

    try {
        // Gist ID인지 확인 (영숫자만 포함, %나 = 없으면 새 방식)
        if (!/[%=]/.test(hash) && /^[a-zA-Z0-9]+$/.test(hash)) {
            // 서버에서 데이터 가져오기
            const response = await fetch(`/api/load/${hash}`);

            if (!response.ok) {
                throw new Error('데이터를 찾을 수 없거나 만료되었습니다');
            }

            const result = await response.json();
            const data = result.data;

            // 데이터 복원
            if (Array.isArray(data)) {
                followingData = restoreData(data);
            } else if (data.content && data.content.followingList) {
                followingData = data.content.followingList;
            } else {
                throw new Error('올바르지 않은 데이터 형식입니다');
            }

            filteredData = followingData;
            renderGrid();
            updateStats();

            setTimeout(() => {
                alert(`✅ ${followingData.length}명의 팔로우 목록을 불러왔습니다!`);
            }, 100);
            return;
        }

        // 이전 방식 (긴 URL 하위 호환성)
        const urlDecoded = decodeURIComponent(hash);
        let decompressed = LZString.decompressFromBase64(urlDecoded);

        // 이전 버전 호환성 (EncodedURIComponent 방식)
        if (!decompressed) {
            decompressed = LZString.decompressFromEncodedURIComponent(hash);
        }

        if (!decompressed) {
            document.getElementById('emptyState').classList.remove('d-none');
            return;
        }

        const data = JSON.parse(decompressed);

        // 새로운 최적화 형식
        if (Array.isArray(data)) {
            followingData = restoreData(data);
        }
        // 이전 형식 (하위 호환성)
        else if (data.content && data.content.followingList) {
            followingData = data.content.followingList;
        }
        else {
            document.getElementById('emptyState').classList.remove('d-none');
            return;
        }

        filteredData = followingData;
        renderGrid();
        updateStats();

        setTimeout(() => {
            alert(`✅ ${followingData.length}명의 팔로우 목록을 불러왔습니다!`);
        }, 100);
    } catch (error) {
        console.error('URL 데이터 로드 실패:', error);
        alert('데이터를 불러올 수 없습니다.\n' + error.message);
        document.getElementById('emptyState').classList.remove('d-none');
    }
}

window.addEventListener('load', () => {
    loadFromURL();
});