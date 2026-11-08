import {catalog,tasks,industries,budgets} from './catalog.mjs';
export const emptyProfile=()=>({industry:'',business:'',group:'',task:'',description:'',process:'',systems:[],toolNames:'',budgetBand:'',budgetExact:'',hours:'',rate:'',spend:'',goal:''});
export function number(value){if(value===''||value===null||value===undefined)return null;const n=Number(value);return Number.isFinite(n)&&n>=0?n:null;}
export function budgetOf(p){return number(p.budgetExact)??budgets.find(b=>b[0]===p.budgetBand)?.[2]??null;}
export function resolveTask(p){if(p.group!=='write')return tasks.find(t=>t.id===p.task)||null;const text=p.description.toLowerCase();return tasks.find(t=>t.keywords.test(text))||null;}
export function businessName(p){return p.business.trim()||industries.find(i=>i[0]===p.industry)?.[1]||'your business';}
export function fit(tool,p){
 const task=resolveTask(p),direct=!!task&&tool.tasks.includes(task.id),industryOk=!tool.industries.length||tool.industries.includes(p.industry);
 const names=p.toolNames.toLowerCase(),existing=tool.existing.some(x=>names.includes(x.toLowerCase()));
 const b=budgetOf(p),free=b===0,priceKnown=tool.price!==null,affordable=priceKnown&&(b===null||tool.price<=b);
 const details=p.description.toLowerCase(),detailMatch=tasks.filter(t=>t.keywords.test(details)).some(t=>tool.tasks.includes(t.id));
 let score=(direct?53:10)+(industryOk?12:0)+(existing?12:tool.existing.length?3:8)+(affordable?17:free?0:7)+(4-tool.effort)*3+(detailMatch?4:0);
 score=Math.max(10,Math.min(98,score));
 const eligible=direct&&industryOk&&(!free||tool.price===0);
 const setup=p.systems.includes('none')?'No current tools required for a manual trial.':tool.id==='canva'||tool.id==='chatgpt'?'Use manual download or copy and paste alongside your '+(p.systems.includes('sheets')?'spreadsheet':p.systems.includes('email')?'email and calendar':'current tools')+'.':existing?'Your named setup includes '+tool.existing.find(x=>names.includes(x.toLowerCase()))+'. Verify the exact plan and workflow.':'Compatibility with your existing setup is unverified; check it before connecting.';
 const reason=direct?`${tool.name} supports ${task.label.toLowerCase()} for ${businessName(p)}.`:`An adjacent catalog option; it does not directly cover ${task?.label.toLowerCase()||'your description yet'}.`;
 return {score,eligible,direct,industryOk,setup,reason,detail:details?`Your detail: “${p.description}”`:'',budget:tool.price===0?'Start with the free tier.':free?'Ongoing price is unconfirmed; does not meet Free only.':b===null?'Budget is still undecided; confirm a quote first.':`Confirm a quote against your $${b}/month limit.`};
}
export function matches(p,source=catalog){return source.map(t=>({...t,fit:fit(t,p)})).sort((a,b)=>b.fit.score-a.fit.score);}
export function strongMatches(p,source=catalog){return matches(p,source).filter(t=>t.fit.eligible).slice(0,3);}
export function gapFor(p,source=catalog){const t=resolveTask(p);if(!t)return 'We could not identify a specific task from that description. Add what you want to do and what a good result looks like, or browse the catalog below.';if(!strongMatches(p,source).length)return budgetOf(p)===0?'No documented free-tier match covers this task in our current catalog. You can clarify the task, change the budget, or browse paid options with unconfirmed prices.':'Our current catalog has no direct match for this task and business. Clarify what you need, or browse adjacent options below. We will not treat an unsupported capability as a strong match.';return '';}
export function totals(p,selected,quotes={},estimate={}){
 const prices=selected.map(t=>number(quotes[t.id])??t.price),unknown=prices.some(x=>x===null),knownCost=prices.reduce((a,b)=>a+(b??0),0),budget=budgetOf(p);
 const baseline=number(p.hours),freed=number(estimate.freed),validFreed=freed!==null&&(baseline===null||freed<=baseline);
 const spend=number(p.spend),reduction=number(estimate.reduction),explicit=!!estimate.expense?.trim()&&reduction!==null&&spend!==null&&reduction<=spend;
 return {knownCost,unknown,budget,budgetStatus:unknown?'Budget fit pending':budget===null?'Set a budget to check fit':knownCost<=budget?'Within your budget':'Over your budget',freed:validFreed?freed:null,timeValue:validFreed&&number(p.rate)!==null?freed*number(p.rate)*4.33:null,cash:explicit?reduction:null,netCash:explicit&&!unknown?reduction-knownCost:null};
}
export function handoff(a,b){
 if([a.id,b.id].includes('chatgpt')&&[a.id,b.id].includes('canva'))return {kind:'Manual',from:'ChatGPT',to:'Canva AI',information:'Reviewed offer copy, exact price, dates and a redemption code',owner:'Draft the promotion in ChatGPT. Check every fact, then paste the approved copy into a Canva flyer template. Review and download the design; publish it yourself.',note:'Manual copy and paste. No automatic integration is claimed.'};
 if([a.id,b.id].includes('canva')&&[a.id,b.id].includes('mailchimp'))return {kind:'Manual',from:'Canva AI',to:'Mailchimp',information:'An approved flyer image and accessible offer text',owner:'Download the reviewed design from Canva. Upload it into a Mailchimp email, add the offer as readable text, send yourself a test, then send to an opted-in list.',note:'Manual file upload. No automatic integration is claimed.'};
 return {kind:'Manual',from:a.name,to:b.name,information:a.handoff,owner:`Review the ${a.handoff.toLowerCase()}, then copy, download or enter only the required information into ${b.name}. Test one record before continuing.`,note:'No automatic integration is verified for this pair. Check both vendors before automating.'};}
export function coachPayload(p,selected,metric){return {schemaVersion:1,task:resolveTask(p)?.label||p.description,description:p.description,industry:p.industry,business:p.business,currentProcess:p.process,existingTools:{categories:p.systems,names:p.toolNames},budget:{monthlyLimit:budgetOf(p),band:p.budgetBand},baseline:{hoursPerWeek:number(p.hours),hourlyValue:number(p.rate),monthlyCashSpending:number(p.spend),newInitiativeGoal:p.goal},selectedTools:selected.map(t=>({id:t.id,name:t.name,price:t.price,evidence:t.evidence})),successMetric:metric};}
