import { useEffect, useState } from "react";



export default function useDebounceHook(input:string){

    const [finalInput,setFinalInput]=useState<string>("")


    useEffect(()=>{

        const timer=setTimeout(()=>{

            setFinalInput(input)
        },500)

    
    return ()=>clearTimeout(timer)
    },[input])


    return [finalInput, setFinalInput] as const;
}