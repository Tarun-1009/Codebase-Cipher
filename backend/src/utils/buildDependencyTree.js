const unzipper = require('unzipper');
async function BuildDependencyTree(username,repo){
    const url=`https://github.com/${username}/${repo}/zipball/main/`;
    const response = await axios({ method: 'get', url, responseType: 'stream' });

    const tree={name: repo, type: 'folder', children: []};

    const promise = new Promise((resolve,reject)=>{
        response.data.pipe(unizepper.parse())
        .on('enter',(entry)=>{
            const FilePath=entry.path;
            const pathSegments = entry.path.split('/');
            if (!pathSegments) {
                entry.autodrain();
                return;
            }

            if(entry.type=='File'){

                const dependency=[];

                //calling function to get dependency by sending file contents

                addTree(dependencies,pathSegments,'file',dependency);
                
            }else{
            entry.autodrain();
            }
        })
        .on('finish', () => resolve(tree))
        .on('error', reject)
    })
    
    
}

// build tree structure with dependencies array

function addTree(tree,pathSegments,type,dependncy){
    const current =tree;
    for(let i=0;i<pathSegments.length;i++){
        const seg=pathSegments[i];

        const isLast = i=== pathSegments.length-1;
        
        //find the chile
        let existingChild = current.children.find(child => child.name === seg);
        if(!exitingChild){
            existingChild={ 
                name: seg, 
                type: isLast?type:'folder', 
                children: isLast? undefined:[],
            };
            if(isLast && type==='file'){
                existingChild.dependencies = dependencies;
            }
            current.children.push(existingChild);
        }
        current = existingChild;
    }
}
module.exports={BuildDependencyTree};