'use strict';
{
  const dialog = el('uploadedBillsDialog');
  const list = el('uploadedBillsList');
  const status = el('uploadedBillsStatus');
  const more = el('uploadedBillsMore');
  const labels = {
    queued: 'Waiting for processing', running: 'Processing',
    draft_ready: 'Draft ready', failed: 'Processing failed',
    needs_review: 'Needs review', approved: 'Approved', rejected: 'Rejected'
  };
  let revision = 0;
  let next = null;

  function element(tag, value) {
    const item = document.createElement(tag);
    item.textContent = value;
    return item;
  }

  function clear() {
    revision++;
    next = null;
    more.hidden = true;
    status.textContent = '';
    list.replaceChildren();
  }

  async function loadPage(append = false) {
    if (!append) clear();
    const current = ++revision;
    more.disabled = true;
    status.textContent = 'Loading bills…';
    try {
      const params = new URLSearchParams({limit: '25'});
      if (append && next) params.set('before', next);
      const data = await api(`/api/submissions?${params}`);
      if (current !== revision || !dialog.open) return;
      for (const bill of data.submissions) {
        const row = element('article', '');
        row.className = 'history-row';
        const date = new Date(bill.created * 1000).toLocaleDateString();
        const label = labels[bill.review_status || bill.status] || 'Saved';
        const detail = element('details', '');
        detail.append(element('summary', `${date} · ${label} · ${bill.file_count} file(s)`));
        const body = element('div', '');
        detail.append(body);
        detail.addEventListener('toggle', async () => {
          if (!detail.open || body.dataset.loading) return;
          body.dataset.loading = 'true';
          body.textContent = 'Loading bill…';
          try {
            const path = `/api/submissions/${encodeURIComponent(bill.submission_id)}`;
            const record = await api(path);
            if (!dialog.open || !body.isConnected) return;
            body.replaceChildren(element('small', `Receipt ${record.submission_id}`));
            if (record.draft) {
              const draft = record.draft;
              if (draft.vendor) body.append(element('p', draft.vendor));
              if (draft.bill_date) body.append(element('p', draft.bill_date));
              if (draft.total_minor !== null && draft.currency) {
                body.append(element('p', `${draft.currency} ${(draft.total_minor / 100).toFixed(2)}`));
              }
            }
            const files = element('ul', '');
            for (const file of record.files) {
              const link = element('a', file.filename);
              link.href = `${path}/files/${file.position}`;
              link.download = file.filename;
              const line = element('li', '');
              line.append(link);
              files.append(line);
            }
            body.append(files);
          } catch (error) {
            if (dialog.open && body.isConnected) showError(error, body);
          } finally {
            delete body.dataset.loading;
          }
        });
        row.append(detail);
        list.append(row);
      }
      next = data.next_before;
      more.hidden = !next;
      status.textContent = data.submissions.length ? '' : 'No uploaded bills yet.';
    } catch (error) {
      if (current === revision && dialog.open) showError(error, status);
    } finally {
      if (current === revision) more.disabled = false;
    }
  }

  function showError(error, target) {
    if (error.status === 401) showLogin('Please sign in to view bills.');
    else target.textContent = error.message;
  }

  el('openUploadedBills').onclick = () => {
    el('historyDialog').close();
    dialog.showModal();
    loadPage();
  };
  el('backToHistorical').onclick = () => {
    dialog.close();
    el('openHistory').click();
  };
  el('refreshUploadedBills').onclick = () => loadPage();
  more.onclick = () => loadPage(true);
  dialog.addEventListener('close', () => {
    if (!dialog.open) clear();
  });
}
