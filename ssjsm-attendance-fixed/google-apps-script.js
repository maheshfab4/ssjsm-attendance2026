/**
 * Google Apps Script - Attendance Tracker API
 * UPDATED: members now have an "effectiveFrom" date.
 * Attendance is only recorded for members active on the duty's date.
 *
 * SETUP:
 * 1. Open your Google Sheet
 * 2. Go to Extensions -> Apps Script
 * 3. Paste this entire code (replace everything)
 * 4. Save and Deploy as Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. IMPORTANT: run migrateAddEffectiveFromColumn() once from the editor
 *    (select it in the function dropdown, click Run). It adds the new
 *    column header. It does not modify any existing data.
 *
 * SHEET TABS NEEDED (headers in Row 1):
 *   Groups     -> id, name, leaderName, pin
 *   Members    -> id, groupId, name, phone, firmName, photoUrl, effectiveFrom
 *   Duties     -> id, groupId, date, title, description
 *   Attendance -> odId, dutyId, memberId, present, markedAt, markedBy
 *
 * BACKWARD COMPATIBILITY:
 *   A blank effectiveFrom means "always active". Every member you already
 *   have will be blank, so all previously submitted attendance keeps
 *   behaving exactly as before. Nothing is rewritten or deleted.
 */

// Column positions in the Members sheet (1-based)
var MEMBER_COL_ID = 1;
var MEMBER_COL_GROUP_ID = 2;
var MEMBER_COL_NAME = 3;
var MEMBER_COL_PHONE = 4;
var MEMBER_COL_FIRM = 5;
var MEMBER_COL_PHOTO = 6;
var MEMBER_COL_EFFECTIVE_FROM = 7;

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAllData';
    var result;
    if (action === 'ping') {
      result = { success: true, message: 'API is working' };
    } else {
      result = getAllData();
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result;

    if (action === 'addMember') {
      result = addMember(data.groupId, data.member);
    } else if (action === 'updateMember') {
      result = updateMember(data.memberId, data.updates);
    } else if (action === 'deleteMember') {
      result = deleteMember(data.memberId);
    } else if (action === 'addDuty') {
      result = addDuty(data.groupId, data.duty);
    } else if (action === 'deleteDuty') {
      result = deleteDuty(data.dutyId);
    } else if (action === 'submitAttendance') {
      result = submitAttendance(data.dutyId, data.groupId, data.presentMemberIds, data.markedBy);
    } else if (action === 'updateGroup') {
      result = updateGroup(data.groupId, data.updates);
    } else if (action === 'importMembers') {
      result = importMembers(data.groupId, data.members);
    } else if (action === 'initializeGroups') {
      result = initializeGroups(data.groups);
    } else {
      result = { error: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== HELPER: Read sheet into objects ====================

function sheetToObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = [];
  for (var h = 0; h < data[0].length; h++) {
    headers.push(String(data[0][h]).trim());
  }

  var objects = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var isEmpty = true;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== '' && row[c] !== null && row[c] !== undefined) { isEmpty = false; break; }
    }
    if (isEmpty) continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = (j < row.length) ? row[j] : '';
      obj[headers[j]] = val;
    }
    objects.push(obj);
  }
  return objects;
}

function getVal(obj, keys, fallback) {
  for (var i = 0; i < keys.length; i++) {
    if (obj[keys[i]] !== undefined && obj[keys[i]] !== null && obj[keys[i]] !== '') return obj[keys[i]];
  }
  var objKeys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    var lower = keys[i].toLowerCase();
    for (var j = 0; j < objKeys.length; j++) {
      if (objKeys[j].toLowerCase() === lower) {
        var v = obj[objKeys[j]];
        if (v !== undefined && v !== null && v !== '') return v;
      }
    }
  }
  return (fallback !== undefined) ? fallback : '';
}

function s(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

// ==================== HELPER: Dates ====================

/**
 * Normalises anything Sheets gives us (Date object, text, blank)
 * into a 'YYYY-MM-DD' string. Returns '' when there is no usable date.
 */
function toISODate(val) {
  if (val === null || val === undefined || val === '') return '';

  if (Object.prototype.toString.call(val) === '[object Date]') {
    if (isNaN(val.getTime())) return '';
    return formatDate(val);
  }

  var str = String(val).trim();
  if (!str) return '';

  // Already in the right shape - use as-is, no timezone round-trip.
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  var parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return formatDate(parsed);

  return '';
}

function formatDate(d) {
  var yyyy = d.getFullYear();
  var mm = ('0' + (d.getMonth() + 1)).slice(-2);
  var dd = ('0' + d.getDate()).slice(-2);
  return yyyy + '-' + mm + '-' + dd;
}

function todayISO() {
  return formatDate(new Date());
}

/**
 * Should this member appear on the attendance sheet for this duty date?
 * Blank effectiveFrom  -> yes (legacy members, unchanged behaviour)
 * Blank/unknown duty date -> yes (never hide someone because of a bad date)
 */
function isMemberActiveOn(effectiveFrom, dutyDate) {
  var from = toISODate(effectiveFrom);
  if (!from) return true;
  var on = toISODate(dutyDate);
  if (!on) return true;
  return on >= from; // string compare is safe for YYYY-MM-DD
}

function getDutyDate(dutyId) {
  var sheet = getSpreadsheet().getSheetByName('Duties');
  if (!sheet) return '';
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(dutyId).trim()) {
      return toISODate(data[i][2]);
    }
  }
  return '';
}

// ==================== READ ====================

function getAllData() {
  var ss = getSpreadsheet();

  var groupsSheet = ss.getSheetByName('Groups');
  var membersSheet = ss.getSheetByName('Members');
  var dutiesSheet = ss.getSheetByName('Duties');
  var attendanceSheet = ss.getSheetByName('Attendance');

  var rawGroups = sheetToObjects(groupsSheet);
  var rawMembers = sheetToObjects(membersSheet);
  var rawDuties = sheetToObjects(dutiesSheet);
  var rawAttendance = sheetToObjects(attendanceSheet);

  var groups = [];
  for (var g = 0; g < rawGroups.length; g++) {
    var rg = rawGroups[g];
    var gid = s(getVal(rg, ['id', 'Id', 'ID'], ''));
    if (!gid) continue;

    var pin = getVal(rg, ['pin', 'Pin', 'PIN'], '1234');
    pin = String(pin);
    if (pin.indexOf('.') > -1) {
      pin = pin.split('.')[0];
    }
    pin = pin.trim();

    // Find members for this group
    var members = [];
    for (var m = 0; m < rawMembers.length; m++) {
      var rm = rawMembers[m];
      var mid = s(getVal(rm, ['id', 'Id', 'ID'], ''));
      var mgid = s(getVal(rm, ['groupId', 'groupid', 'GroupId', 'group_id', 'group'], ''));
      if (mgid === gid) {
        members.push({
          id: mid,
          name: s(getVal(rm, ['name', 'Name', 'member', 'Member', 'memberName'], '')),
          phone: s(getVal(rm, ['phone', 'Phone', 'mobile', 'Mobile', 'contact', 'Contact', 'phoneNumber'], '')),
          firmName: s(getVal(rm, ['firmName', 'firmname', 'firm', 'Firm', 'company', 'Company', 'firm_name', 'FirmName'], '')),
          photoUrl: s(getVal(rm, ['photoUrl', 'photourl', 'photo', 'Photo', 'image', 'Image', 'photo_url', 'PhotoUrl', 'PhotoURL'], '')),
          effectiveFrom: toISODate(getVal(rm, ['effectiveFrom', 'effectivefrom', 'effective_from', 'EffectiveFrom', 'joinDate', 'joindate', 'join_date', 'JoinDate', 'joinedOn', 'startDate', 'start_date'], ''))
        });
      }
    }

    // Find duties for this group
    var duties = [];
    var dutyIds = {};
    for (var d = 0; d < rawDuties.length; d++) {
      var rd = rawDuties[d];
      var did = s(getVal(rd, ['id', 'Id', 'ID'], ''));
      var dgid = s(getVal(rd, ['groupId', 'groupid', 'GroupId', 'group_id', 'group'], ''));
      if (dgid === gid) {
        duties.push({
          id: did,
          date: toISODate(getVal(rd, ['date', 'Date', 'duty_date', 'dutyDate'], '')),
          title: s(getVal(rd, ['title', 'Title', 'duty', 'Duty', 'dutyName', 'duty_title'], '')),
          description: s(getVal(rd, ['description', 'Description', 'desc', 'Desc', 'details', 'Details', 'note', 'notes'], ''))
        });
        dutyIds[did] = true;
      }
    }

    // Find attendance for this group's duties
    var attendance = [];
    for (var a = 0; a < rawAttendance.length; a++) {
      var ra = rawAttendance[a];
      var adutyId = s(getVal(ra, ['dutyId', 'dutyid', 'duty_id', 'DutyId'], ''));
      if (dutyIds[adutyId]) {
        var presentVal = getVal(ra, ['present', 'Present', 'status', 'Status'], '');
        var isPresent = false;
        if (presentVal === true || presentVal === 'TRUE' || presentVal === 'true' || presentVal === 'yes' || presentVal === 'Yes' || presentVal === 1 || presentVal === '1') {
          isPresent = true;
        }
        attendance.push({
          odId: s(getVal(ra, ['odId', 'odid', 'od_id', 'OdId', 'id', 'Id', 'ID'], '')),
          dutyId: adutyId,
          memberId: s(getVal(ra, ['memberId', 'memberid', 'member_id', 'MemberId'], '')),
          present: isPresent,
          markedAt: s(getVal(ra, ['markedAt', 'markedat', 'marked_at', 'MarkedAt', 'timestamp'], '')),
          markedBy: s(getVal(ra, ['markedBy', 'markedby', 'marked_by', 'MarkedBy'], ''))
        });
      }
    }

    groups.push({
      id: gid,
      name: s(getVal(rg, ['name', 'Name', 'groupName', 'group_name', 'GroupName'], 'Group ' + (g + 1))),
      leaderName: s(getVal(rg, ['leaderName', 'leadername', 'leader', 'Leader', 'leader_name', 'LeaderName'], 'Leader ' + (g + 1))),
      pin: pin,
      members: members,
      duties: duties,
      attendance: attendance
    });
  }

  return { success: true, groups: groups };
}

// ==================== WRITE OPERATIONS ====================

function generateId(prefix) {
  return prefix + '_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 6);
}

function addMember(groupId, member) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Members');
  var id = generateId('member');

  // Default to today so a new member never silently back-fills history.
  var effectiveFrom = toISODate(member.effectiveFrom) || todayISO();

  sheet.appendRow([
    id,
    groupId,
    member.name || '',
    member.phone || '',
    member.firmName || '',
    member.photoUrl || '',
    effectiveFrom
  ]);

  // Keep it as plain text so Sheets does not shift the date by a timezone.
  sheet.getRange(sheet.getLastRow(), MEMBER_COL_EFFECTIVE_FROM).setNumberFormat('@');

  return { success: true, memberId: id, effectiveFrom: effectiveFrom };
}

function updateMember(memberId, updates) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Members');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(memberId).trim()) {
      var row = i + 1;
      if (updates.name !== undefined) sheet.getRange(row, MEMBER_COL_NAME).setValue(updates.name);
      if (updates.phone !== undefined) sheet.getRange(row, MEMBER_COL_PHONE).setValue(updates.phone);
      if (updates.firmName !== undefined) sheet.getRange(row, MEMBER_COL_FIRM).setValue(updates.firmName);
      if (updates.photoUrl !== undefined) sheet.getRange(row, MEMBER_COL_PHOTO).setValue(updates.photoUrl);
      if (updates.effectiveFrom !== undefined) {
        var cell = sheet.getRange(row, MEMBER_COL_EFFECTIVE_FROM);
        cell.setNumberFormat('@');
        cell.setValue(toISODate(updates.effectiveFrom));
      }
      return { success: true };
    }
  }
  return { error: 'Member not found: ' + memberId };
}

function deleteMember(memberId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Members');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(memberId).trim()) {
      sheet.deleteRow(i + 1);
      deleteAttendanceForMember(memberId);
      return { success: true };
    }
  }
  return { error: 'Member not found' };
}

function deleteAttendanceForMember(memberId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Attendance');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][2]).trim() === String(memberId).trim()) {
      sheet.deleteRow(i + 1);
    }
  }
}

function addDuty(groupId, duty) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Duties');
  var id = generateId('duty');

  sheet.appendRow([
    id,
    groupId,
    toISODate(duty.date) || '',
    duty.title || '',
    duty.description || ''
  ]);

  return { success: true, dutyId: id };
}

function deleteDuty(dutyId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Duties');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(dutyId).trim()) {
      sheet.deleteRow(i + 1);
      deleteAttendanceForDuty(dutyId);
      return { success: true };
    }
  }
  return { error: 'Duty not found' };
}

function deleteAttendanceForDuty(dutyId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Attendance');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]).trim() === String(dutyId).trim()) {
      sheet.deleteRow(i + 1);
    }
  }
}

/**
 * THE KEY CHANGE.
 * Only members who were active on the duty's date get an attendance row.
 * Someone added later simply does not exist for older duties, so there is
 * nothing to re-submit.
 */
function submitAttendance(dutyId, groupId, presentMemberIds, markedBy) {
  var ss = getSpreadsheet();
  var attendanceSheet = ss.getSheetByName('Attendance');
  var membersSheet = ss.getSheetByName('Members');

  var dutyDate = getDutyDate(dutyId);

  // Collect the members of this group who were active on that date
  var membersData = membersSheet.getDataRange().getValues();
  var eligibleMembers = [];
  for (var i = 1; i < membersData.length; i++) {
    var row = membersData[i];
    if (String(row[MEMBER_COL_GROUP_ID - 1]).trim() !== String(groupId).trim()) continue;

    var effectiveFrom = (row.length >= MEMBER_COL_EFFECTIVE_FROM)
      ? row[MEMBER_COL_EFFECTIVE_FROM - 1]
      : '';

    if (isMemberActiveOn(effectiveFrom, dutyDate)) {
      eligibleMembers.push(String(row[MEMBER_COL_ID - 1]).trim());
    }
  }

  // Replace any existing attendance for this duty
  deleteAttendanceForDuty(dutyId);

  var presentSet = {};
  if (presentMemberIds && presentMemberIds.length) {
    for (var p = 0; p < presentMemberIds.length; p++) {
      presentSet[String(presentMemberIds[p]).trim()] = true;
    }
  }

  var now = new Date().toISOString();
  var rows = [];
  for (var m = 0; m < eligibleMembers.length; m++) {
    var mid = eligibleMembers[m];
    rows.push([
      generateId('att'),
      dutyId,
      mid,
      presentSet[mid] ? 'TRUE' : 'FALSE',
      now,
      markedBy || ''
    ]);
  }

  if (rows.length) {
    attendanceSheet
      .getRange(attendanceSheet.getLastRow() + 1, 1, rows.length, rows[0].length)
      .setValues(rows);
  }

  return { success: true, recordCount: rows.length, dutyDate: dutyDate };
}

function updateGroup(groupId, updates) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Groups');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(groupId).trim()) {
      if (updates.name !== undefined) sheet.getRange(i + 1, 2).setValue(updates.name);
      if (updates.leaderName !== undefined) sheet.getRange(i + 1, 3).setValue(updates.leaderName);
      if (updates.pin !== undefined) sheet.getRange(i + 1, 4).setValue(updates.pin);
      return { success: true };
    }
  }
  return { error: 'Group not found' };
}

function importMembers(groupId, members) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Members');
  var fallback = todayISO();
  var ids = [];
  var rows = [];

  for (var i = 0; i < members.length; i++) {
    var id = generateId('member');
    rows.push([
      id,
      groupId,
      members[i].name || '',
      members[i].phone || '',
      members[i].firmName || '',
      members[i].photoUrl || '',
      toISODate(members[i].effectiveFrom) || fallback
    ]);
    ids.push(id);
  }

  if (rows.length) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, MEMBER_COL_EFFECTIVE_FROM, rows.length, 1).setNumberFormat('@');
    sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
  }

  return { success: true, memberIds: ids, count: ids.length };
}

function initializeGroups(groups) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Groups');

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  for (var i = 0; i < groups.length; i++) {
    sheet.appendRow([
      groups[i].id,
      groups[i].name,
      groups[i].leaderName,
      groups[i].pin
    ]);
  }

  return { success: true, count: groups.length };
}

// ==================== ONE-TIME MIGRATION ====================

/**
 * Run this ONCE from the Apps Script editor after pasting this file.
 * Adds the effectiveFrom header to the Members sheet and formats the
 * column as plain text. Existing member rows are left blank, which means
 * "always active" - so none of your existing attendance changes.
 * Safe to run more than once.
 */
function migrateAddEffectiveFromColumn() {
  var sheet = getSpreadsheet().getSheetByName('Members');
  if (!sheet) throw new Error('Members sheet not found');

  var header = sheet.getRange(1, MEMBER_COL_EFFECTIVE_FROM).getValue();
  if (s(header).toLowerCase() !== 'effectivefrom') {
    if (s(header) !== '') {
      throw new Error(
        'Column G of Members already contains "' + header +
        '". Move it before running this migration.'
      );
    }
    sheet.getRange(1, MEMBER_COL_EFFECTIVE_FROM).setValue('effectiveFrom');
  }

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, MEMBER_COL_EFFECTIVE_FROM, lastRow - 1, 1).setNumberFormat('@');
  }

  Logger.log('Migration complete. Existing members left blank = always active.');
  return { success: true };
}

/**
 * OPTIONAL. Only run this if you want existing members to have an explicit
 * date instead of blank. It sets every blank effectiveFrom to the earliest
 * duty date of that member's group, which reproduces current behaviour
 * exactly - just written down rather than implied.
 */
function backfillEffectiveFromEarliestDuty() {
  var ss = getSpreadsheet();
  var membersSheet = ss.getSheetByName('Members');
  var dutiesSheet = ss.getSheetByName('Duties');
  if (!membersSheet || !dutiesSheet) throw new Error('Missing Members or Duties sheet');

  // Earliest duty date per group
  var dutyData = dutiesSheet.getDataRange().getValues();
  var earliest = {};
  for (var d = 1; d < dutyData.length; d++) {
    var gid = String(dutyData[d][1]).trim();
    var date = toISODate(dutyData[d][2]);
    if (!gid || !date) continue;
    if (!earliest[gid] || date < earliest[gid]) earliest[gid] = date;
  }

  var memberData = membersSheet.getDataRange().getValues();
  var updated = 0;
  for (var i = 1; i < memberData.length; i++) {
    var row = memberData[i];
    if (!String(row[MEMBER_COL_ID - 1]).trim()) continue;

    var existing = (row.length >= MEMBER_COL_EFFECTIVE_FROM) ? s(row[MEMBER_COL_EFFECTIVE_FROM - 1]) : '';
    if (existing) continue;

    var mgid = String(row[MEMBER_COL_GROUP_ID - 1]).trim();
    var fill = earliest[mgid];
    if (!fill) continue;

    var cell = membersSheet.getRange(i + 1, MEMBER_COL_EFFECTIVE_FROM);
    cell.setNumberFormat('@');
    cell.setValue(fill);
    updated++;
  }

  Logger.log('Backfilled ' + updated + ' members.');
  return { success: true, updated: updated };
}

// Run this manually to test
function testScript() {
  var result = getAllData();
  Logger.log(JSON.stringify(result, null, 2));
}
